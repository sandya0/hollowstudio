import "./globals.css";


export const metadata = {
  description: "Hollo Studio is a digital design and development studio crafting impactful, performance-focused web experiences. We partner with brands to build solutions that stand out.",
  keywords: ["web design", "web development", "digital agency", "Hollo Studio", "design studio", "development studio"],
  openGraph: {
    title: "Hollo Studio | Digital Design and Development",
    description: "Hollo Studio is a digital design and development studio crafting impactful, performance-focused web experiences. We partner with brands to build solutions that stand out.",
    url: "https://hollo.studio",
    siteName: "Hollo Studio",
    images: [
      {
        url: "https://hollo.studio/og-image.jpg",
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
    url: 'https://hollo.studio',
    logo: 'https://hollo.studio/logo.png',
    description: 'Digital design and development studio.',
    sameAs: [
      'https://www.instagram.com/hollostudioco',
      'https://www.linkedin.com/company/hollostudio',
    ],
    image: 'https://hollo.studio/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
    },
  };

  return (
    <html lang="en">
      <body
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
