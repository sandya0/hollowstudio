'use client';

import { useEffect, useRef } from 'react';

export default function FluidAnimation({ onReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let animationId = null;
    let isInitialized = false;
    let gl = null;
    let ext = null;
    let pointers = [];
    let dye, velocity, divergence, curlFBO, pressure;
    let blurProgram, copyProgram, clearProgram, colorProgram, splatProgram, advectionProgram;
    let divergenceProgram, curlProgram, vorticityProgram, pressureProgram, gradientSubtractProgram;
    let displayMaterial;
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;
    let config;

    // FPS cap
    let lastFrameTime = 0;
    const TARGET_FPS = 35;
    const FRAME_TIME = 1000 / TARGET_FPS;

    // Init function
    const initFluid = () => {
      if (isInitialized) return;
      isInitialized = true;

      // Device detection & presets
      const isLowEndDevice =
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        window.innerWidth < 768 ||
        /Mobi|Android/i.test(navigator.userAgent);

      const ULTRA_LITE = false; 

      // Performance-tuned config
        config = {
          SIM_RESOLUTION: 56,
          DYE_RESOLUTION: 384,
          DENSITY_DISSIPATION: 3.8,
          VELOCITY_DISSIPATION: 2.2,
          PRESSURE: 0.05,
          PRESSURE_ITERATIONS: 5,
          CURL: 1.6,
          SPLAT_RADIUS: 0.12,
          SPLAT_FORCE: 2200,
          SHADING: false,
          COLOR_UPDATE_SPEED: 6,
          TRANSPARENT: true,
        };


      if (isLowEndDevice) {
          config.SIM_RESOLUTION = 40;
          config.DYE_RESOLUTION = 256;
          config.PRESSURE_ITERATIONS = 3;
          config.CURL = 1.0;
          config.SPLAT_FORCE = 1600;
      }
      if (ULTRA_LITE) {
        config.SIM_RESOLUTION = 48;
        config.DYE_RESOLUTION = 256;
        config.PRESSURE_ITERATIONS = 4;
        config.CURL = 1.5;
        config.SHADING = false;
        config.SPLAT_FORCE = 2000;
      }

      // DPR clamp to avoid huge GL buffers on high-DPI displays
      const DPR_LIMIT = 1.0;  
      function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
        const width = Math.floor(window.innerWidth * dpr);
        const height = Math.floor(window.innerHeight * dpr);

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          canvas.style.width = window.innerWidth + 'px';
          canvas.style.height = window.innerHeight + 'px';
          try {
            if (gl && gl.viewport) gl.viewport(0, 0, width, height);
          } catch (e) {
            // ignore if gl not ready
          }
          return true;
        }
        return false;
      }

      // Setup pointers
      function pointerPrototype() {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = { r: 0.15, g: 0.15, b: 0.15 };
      }
      pointers = [new pointerPrototype()];

      // WebGL context and extensions
      ({ gl, ext } = getWebGLContext(canvas));

      // initial resize (safe even before gl)
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = Math.max(256, Math.min(config.DYE_RESOLUTION, 512));
        config.SHADING = false;
      }

      // Utilities (GL + shader + fbo helpers)
      function getWebGLContext(canvas) {
        const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
        let _gl = canvas.getContext('webgl2', params);
        const isWebGL2 = !!_gl;
        if (!isWebGL2) _gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

        let halfFloat, supportLinearFiltering;
        if (isWebGL2) {
          _gl.getExtension('EXT_color_buffer_float');
          supportLinearFiltering = _gl.getExtension('OES_texture_float_linear');
        } else {
          halfFloat = _gl.getExtension('OES_texture_half_float');
          supportLinearFiltering = _gl.getExtension('OES_texture_half_float_linear');
        }

        _gl.clearColor(0.0, 0.0, 0.0, 1.0);

        const halfFloatTexType = isWebGL2 ? _gl.HALF_FLOAT : (halfFloat && halfFloat.HALF_FLOAT_OES);
        let formatRGBA, formatRG, formatR;

        if (isWebGL2) {
          formatRGBA = getSupportedFormat(_gl, _gl.RGBA16F, _gl.RGBA, halfFloatTexType);
          formatRG = getSupportedFormat(_gl, _gl.RG16F, _gl.RG, halfFloatTexType);
          formatR = getSupportedFormat(_gl, _gl.R16F, _gl.RED, halfFloatTexType);
        } else {
          formatRGBA = getSupportedFormat(_gl, _gl.RGBA, _gl.RGBA, halfFloatTexType);
          formatRG = getSupportedFormat(_gl, _gl.RGBA, _gl.RGBA, halfFloatTexType);
          formatR = getSupportedFormat(_gl, _gl.RGBA, _gl.RGBA, halfFloatTexType);
        }

        return {
          gl: _gl,
          ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
          }
        };
      }

      function getSupportedFormat(_gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(_gl, internalFormat, format, type)) {
          switch (internalFormat) {
            case _gl.R16F:
              return getSupportedFormat(_gl, _gl.RG16F, _gl.RG, type);
            case _gl.RG16F:
              return getSupportedFormat(_gl, _gl.RGBA16F, _gl.RGBA, type);
            default:
              return null;
          }
        }
        return { internalFormat, format };
      }

      function supportRenderTextureFormat(_gl, internalFormat, format, type) {
        let texture = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, texture);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        let fbo = _gl.createFramebuffer();
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, fbo);
        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, texture, 0);

        let status = _gl.checkFramebufferStatus(_gl.FRAMEBUFFER);
        return status == _gl.FRAMEBUFFER_COMPLETE;
      }

      // Shader / program / uniform helpers
      function compileShader(type, source, keywords) {
        source = addKeywords(source, keywords);
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          console.trace(gl.getShaderInfoLog(shader));
        return shader;
      }

      function addKeywords(source, keywords) {
        if (keywords == null) return source;
        let keywordsString = '';
        keywords.forEach(keyword => {
          keywordsString += '#define ' + keyword + '\n';
        });
        return keywordsString + source;
      }

      function createProgram(vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
          console.trace(gl.getProgramInfoLog(program));
        return program;
      }

      function getUniforms(program) {
        const uniforms = [];
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const uniformName = gl.getActiveUniform(program, i).name;
          uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
      }

      // base vertex shader (with texel derivatives used by display)
      const baseVertSrc = `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
        void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `;

      const blurVertSrc = `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform vec2 texelSize;
        void main () {
          vUv = aPosition * 0.5 + 0.5;
          float offset = 1.33333333;
          vL = vUv - texelSize * offset;
          vR = vUv + texelSize * offset;
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `;

      const blurFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform sampler2D uTexture;
        void main () {
          vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
          sum += texture2D(uTexture, vL) * 0.35294117;
          sum += texture2D(uTexture, vR) * 0.35294117;
          gl_FragColor = sum;
        }
      `;

      const copyFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        void main () {
          gl_FragColor = texture2D(uTexture, vUv);
        }
      `;

      const clearFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
        void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
        }
      `;

      const colorFragSrc = `
        precision mediump float;
        uniform vec4 color;
        void main () {
          gl_FragColor = color;
        }
      `;

      const displayFragSrc = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform vec2 texelSize;
        void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;
            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);
            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);
            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
          #endif
          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
        }
      `;

      const splatFragSrc = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
        void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
        }
      `;

      const advectionFragSrc = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
        void main () {
          #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
          #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
          #endif
          float decay = 1.0 + dissipation * dt;
          gl_FragColor = result / decay;
        }`;

      const divergenceFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;
          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; }
          if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; }
          if (vB.y < 0.0) { B = -C.y; }
          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `;

      const curlFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          float vorticity = R - L - T + B;
          gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
      `;

      const vorticityFragSrc = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
        void main () {
          float L = texture2D(uCurl, vL).x;
          float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x;
          float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;
          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001;
          force *= curl * C;
          force.y *= -1.0;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity += force * dt;
          velocity = min(max(velocity, -1000.0), 1000.0);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `;

      const pressureFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
        void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          float C = texture2D(uPressure, vUv).x;
          float divergence = texture2D(uDivergence, vUv).x;
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `;

      const gradientSubtractFragSrc = `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
        void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `;

      // Compile shaders & create programs (some with toggles)
      const baseVertexShader = compileShader(gl.VERTEX_SHADER, baseVertSrc);
      const blurVertexShader = compileShader(gl.VERTEX_SHADER, blurVertSrc);

      const blurShader = compileShader(gl.FRAGMENT_SHADER, blurFragSrc);
      const copyShader = compileShader(gl.FRAGMENT_SHADER, copyFragSrc);
      const clearShader = compileShader(gl.FRAGMENT_SHADER, clearFragSrc);
      const colorShader = compileShader(gl.FRAGMENT_SHADER, colorFragSrc);
      const displayShader = compileShader(gl.FRAGMENT_SHADER, displayFragSrc);
      const splatShader = compileShader(gl.FRAGMENT_SHADER, splatFragSrc);

      const advectionShader = compileShader(
        gl.FRAGMENT_SHADER,
        advectionFragSrc,
        ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
      );

      const divergenceShader = compileShader(gl.FRAGMENT_SHADER, divergenceFragSrc);
      const curlShader = compileShader(gl.FRAGMENT_SHADER, curlFragSrc);
      const vorticityShader = compileShader(gl.FRAGMENT_SHADER, vorticityFragSrc);
      const pressureShader = compileShader(gl.FRAGMENT_SHADER, pressureFragSrc);
      const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, gradientSubtractFragSrc);

      // Helper Program wrapper
      class Program {
        constructor(vertexShader, fragmentShader) {
          this.uniforms = {};
          this.program = createProgram(vertexShader, fragmentShader);
          this.uniforms = getUniforms(this.program);
        }
        bind() {
          gl.useProgram(this.program);
        }
      }

      class Material {
        constructor(vertexShader, fragmentShaderSource) {
          this.vertexShader = vertexShader;
          this.fragmentShaderSource = fragmentShaderSource;
          this.programs = [];
          this.activeProgram = null;
          this.uniforms = [];
        }

        setKeywords(keywords) {
          let hash = 0;
          if (keywords) for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

          let program = this.programs[hash];
          if (program == null) {
            let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
          }

          if (program == this.activeProgram) return;
          this.uniforms = getUniforms(program);
          this.activeProgram = program;
        }

        bind() {
          gl.useProgram(this.activeProgram);
        }
      }

      blurProgram = new Program(blurVertexShader, blurShader);
      copyProgram = new Program(baseVertexShader, copyShader);
      clearProgram = new Program(baseVertexShader, clearShader);
      colorProgram = new Program(baseVertexShader, colorShader);
      splatProgram = new Program(baseVertexShader, splatShader);
      advectionProgram = new Program(baseVertexShader, advectionShader);
      divergenceProgram = new Program(baseVertexShader, divergenceShader);
      curlProgram = new Program(baseVertexShader, curlShader);
      vorticityProgram = new Program(baseVertexShader, vorticityShader);
      pressureProgram = new Program(baseVertexShader, pressureShader);
      gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);

      displayMaterial = new Material(baseVertexShader, displayFragSrc);

      function initFramebuffers() {
        const simRes = getResolution(config.SIM_RESOLUTION);
        const dyeRes = getResolution(config.DYE_RESOLUTION);

        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA;
        const rg = ext.formatRG;
        const r = ext.formatR;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        if (!dye) dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

        if (!velocity) velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      }

      function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const texelSizeX = 1.0 / w;
        const texelSizeY = 1.0 / h;

        return {
          texture,
          fbo,
          width: w,
          height: h,
          texelSizeX,
          texelSizeY,
          attach(id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
          }
        };
      }

      function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);

        return {
          width: w,
          height: h,
          texelSizeX: fbo1.texelSizeX,
          texelSizeY: fbo1.texelSizeY,
          get read() { return fbo1; },
          set read(value) { fbo1 = value; },
          get write() { return fbo2; },
          set write(value) { fbo2 = value; },
          swap() {
            const temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
          }
        };
      }

      function resizeFBO(target, w, h, internalFormat, format, type, param) {
        const newFBO = createFBO(w, h, internalFormat, format, type, param);
        copyProgram.bind();
        gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
        blit(newFBO);
        return newFBO;
      }

      function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        if (target.width === w && target.height === h) return target;
        target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
      }

      function updateKeywords() {
        const displayKeywords = [];
        if (config.SHADING) displayKeywords.push("SHADING");
        displayMaterial.setKeywords(displayKeywords);
      }

      updateKeywords();
      initFramebuffers();

      lastUpdateTime = Date.now();
      colorUpdateTimer = 0.0;

      // Full-screen blit setup
      const blit = (() => {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        return (target, clear = false) => {
          if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          } else {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
          }
          if (clear) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          }
          gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
      })();

      // Programs are already wrapped above

      // update loop (with FPS cap)
      function calcDeltaTime() {
        const now = Date.now();
        let dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666); // clamp to 60fps step
        lastUpdateTime = now;
        return dt;
      }

      function updateColors(dt) {
        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (colorUpdateTimer >= 1) {
          colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
          pointers.forEach(p => { p.color = generateColor(); });
        }
      }

      function applyInputs() {
        pointers.forEach(p => {
          if (p.moved) {
            p.moved = false;
            splatPointer(p);
          }
        });
      }

      function step(dt) {
        gl.disable(gl.BLEND);

        // curl
        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curlFBO);

        // vorticity
        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        // divergence
        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        // clear pressure
        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        // pressure (Jacobi)
        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        // reduced iterations for perf (config.PRESSURE_ITERATIONS)
        for (let i = 0; i < Math.min(config.PRESSURE_ITERATIONS, 4); i++) {
          gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
          blit(pressure.write);
          pressure.swap();
        }

        // gradient subtract
        gradientSubtractProgram.bind();
        gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        // advection velocity
        advectionProgram.bind();
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        if (!ext.supportLinearFiltering)
          gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        let velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        // advection dye
        if (!ext.supportLinearFiltering)
          gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();
      }

      function render(target) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        drawDisplay(target);
      }

      function drawDisplay(target) {
        const width = target == null ? gl.drawingBufferWidth : target.width;
        const height = target == null ? gl.drawingBufferHeight : target.height;

        displayMaterial.bind();
        if (config.SHADING)
          gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        blit(target);
      }

      function splatPointer(pointer) {
        const dx = pointer.deltaX * config.SPLAT_FORCE;
        const dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
      }

      function clickSplat(pointer) {
        const color = generateColor();
        color.r *= 10.0;
        color.g *= 10.0;
        color.b *= 10.0;
        const dx = 10 * (Math.random() - 0.5);
        const dy = 30 * (Math.random() - 0.5);
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
      }

      function splat(x, y, dx, dy, color) {
        splatProgram.bind();
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.point, x, y);
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        blit(dye.write);
        dye.swap();
      }

      function correctRadius(radius) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
      }

      function updatePointerDownData(pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = generateColor();
      }

      function updatePointerMoveData(pointer, posX, posY, color) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
        pointer.color = color;
      }

      function updatePointerUpData(pointer) {
        pointer.down = false;
      }

      function correctDeltaX(delta) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
      }

      function correctDeltaY(delta) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
      }

      function generateColor() {
        const c = HSVtoRGB(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
      }

      function HSVtoRGB(h, s, v) {
        let r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);

        switch (i % 6) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
        }
        return { r, g, b };
      }

      function wrap(value, min, max) {
        const range = max - min;
        if (range == 0) return min;
        return (value - min) % range + min;
      }

      function getResolution(resolution) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

        const min = Math.round(resolution);
        const max = Math.round(resolution * aspectRatio);

        if (gl.drawingBufferWidth > gl.drawingBufferHeight)
          return { width: max, height: min };
        else
          return { width: min, height: max };
      }

      function scaleByPixelRatio(input) {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
        return Math.floor(input * pixelRatio);
      }

      function hashCode(s) {
        if (s.length === 0) return 0;
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = (hash << 5) - hash + s.charCodeAt(i);
          hash |= 0;
        }
        return hash;
      }

      // Input handlers (mouse/touch)
      let hasInteracted = false;

      const handleMouseDown = (e) => {
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY);
        updatePointerDownData(pointer, -1, posX, posY);
        clickSplat(pointer);
      };

      const handleMouseMove = (e) => {
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY);
        if (!hasInteracted) {
          hasInteracted = true;
          const color = generateColor();
          updatePointerMoveData(pointer, posX, posY, color);
        } else {
          const color = pointer.color;
          updatePointerMoveData(pointer, posX, posY, color);
        }
      };

      const handleTouchStart = (e) => {
        e.preventDefault();
        const touches = e.targetTouches;
        const pointer = pointers[0];
        if (!hasInteracted) hasInteracted = true;
        for (let i = 0; i < touches.length; i++) {
          const posX = scaleByPixelRatio(touches[i].clientX);
          const posY = scaleByPixelRatio(touches[i].clientY);
          updatePointerDownData(pointer, touches[i].identifier, posX, posY);
        }
      };

      const handleTouchMove = (e) => {
        e.preventDefault();
        const touches = e.targetTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
          const posX = scaleByPixelRatio(touches[i].clientX);
          const posY = scaleByPixelRatio(touches[i].clientY);
          updatePointerMoveData(pointer, posX, posY, pointer.color);
        }
      };

      const handleTouchEnd = (e) => {
        const touches = e.changedTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
          updatePointerUpData(pointer);
        }
      };

      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      // Main loop — now with FPS cap using requestAnimationFrame timestamp
      function update(time) {
        if (!time) time = performance.now();
        if (time - lastFrameTime < FRAME_TIME) {
          animationId = requestAnimationFrame(update);
          return;
        }
        lastFrameTime = time;

        const dt = calcDeltaTime();
        if (resizeCanvas()) initFramebuffers();
        updateColors(dt);
        applyInputs();
        step(dt);
        render(null);
        animationId = requestAnimationFrame(update);
      }

      // 1. START LOOP
      update();

      // 2. TRIGGER READY (MOVED HERE)
      // This is now reachable and fires as soon as the loop begins
      if (onReady) {
        onReady(true);
      }

      // cleanup internal
      const cleanupInternal = () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', resizeCanvas);
      };

      // expose cleanup to outer scope by returning it from initFluid
      return cleanupInternal;
    }; // end initFluid

    // 3. START IMMEDIATELY
    // In React useEffect, we are already mounted, so we just run it.
    const cleanup = initFluid();

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };

  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="fluid"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        touchAction: 'none',
        background: 'transparent',
        display: 'block',
        pointerEvents: 'none'
      }}
    />
  );
}