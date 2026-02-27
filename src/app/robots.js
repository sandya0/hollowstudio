export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: [
          'GPTBot',    
          'ChatGPT-User', 
          'CCBot',      
          'Google-Extended', 
          'FacebookBot', 
          'Omgilibot',
          'anthropic-ai'
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://hollostudio.site/sitemap.xml',
  };
}