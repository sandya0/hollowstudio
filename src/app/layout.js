import "./globals.css";

export const metadata = {
  description: "Hollo Studio is a digital design and development studio based in Gading Serpong, crafting impactful, performance-focused web experiences for brands in Jakarta and worldwide.",
  keywords: ["web design jakarta", "web developer gading serpong", "digital agency tangerang", "web development", "Hollo Studio", "design studio", "creative agency indonesia"],
  openGraph: {
    title: "Hollo Studio | Digital Design and Development",
    description: "Hollo Studio is a digital design and development studio based in Gading Serpong, crafting impactful, performance-focused web experiences for brands in Jakarta and worldwide.",
    url: "https://hollostudio.site",
    siteName: "Hollo Studio",
    images: [
      {
        url: "https://hollostudio.site/hollostudio.png",
        width: 1200,
        height: 630,
        alt: "Hollo Studio Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Hollo Studio',
    url: 'https://hollostudio.site',
    logo: 'https://hollostudio.site/logo.png',
    description: 'Digital design and development studio crafting impactful web experiences.',
    sameAs: [
      'https://www.instagram.com/hollowebstudio',
      'https://www.linkedin.com/in/sandya-pradayan-baa04b213/',
      'https://x.com/sandyaporto'
    ],
    image: 'https://hollostudio.site/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gading Serpong, Tangerang',
      addressRegion: 'Banten',
      addressCountry: 'ID',
    },
    areaServed: [
      {
        "@type": "City",
        "name": "Jakarta"
      },
      {
        "@type": "City",
        "name": "Tangerang"
      },
      {
        "@type": "Country",
        "name": "Indonesia"
      }
    ]
  };

  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}