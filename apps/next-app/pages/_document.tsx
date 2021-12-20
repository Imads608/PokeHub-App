import Document, { Html, Head, Main, NextScript } from 'next/document'
import * as React from 'react';
import theme from '../styles/mui/theme';
import { ServerStyleSheets } from '@mui/styles';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />

        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  const sheet: any = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  try{
      ctx.renderPage = () => originalRenderPage({
          enhanceApp: App => props => sheet.collect(<App {...props}/>)
      });

      const initialProps = await Document.getInitialProps(ctx);
      return { ...initialProps,
          styles: (
              <>
                  {initialProps.styles}
                  {sheet.getStyleElement()}
              </>
          )
      }
  } finally {
      ctx.renderPage(sheet)
  }
  };