import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata = {
  metadataBase: new URL('https://hollostudio.site'),
  title: "Hollo Studio | Web Design and Development",
  description: "Hollo Studio is a web design and development studio based in Gading Serpong, crafting impactful, performance-focused web experiences for brands in Jakarta and worldwide.",
  keywords: ["web design jakarta", "web developer gading serpong", "web agency tangerang", "web development", "Hollo Studio", "design studio", "creative agency indonesia"],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Hollo Studio | Web Design and Development",
    description: "Hollo Studio is a web design and development studio based in Gading Serpong, crafting impactful, performance-focused web experiences for brands in Jakarta and worldwide.",
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
  twitter: {
    card: 'summary_large_image',
    title: 'Hollo Studio | Web Design and Development',
    description: 'Hollo Studio is a web design and development studio based in Gading Serpong, crafting impactful, performance-focused web experiences for brands in Jakarta and worldwide.',
    images: ['https://hollostudio.site/hollostudio.png'],
  }
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Hollo Studio',
    url: 'https://hollostudio.site',
    logo: 'https://hollostudio.site/logo.png',
    description: 'Web design and development studio crafting impactful web experiences.',
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
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SmoothScroll>
        {children}
        </SmoothScroll>
      </body>
    </html>
  );
}