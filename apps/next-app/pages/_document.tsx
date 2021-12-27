/* eslint-disable react/no-unknown-property */
/* eslint-disable @next/next/no-sync-scripts */
import Document, { Html, Head, Main, NextScript } from 'next/document';
import * as React from 'react';
import { ServerStyleSheets } from '@mui/styles';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content="#f50057" />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/nprogress/0.2.0/nprogress.min.css"
            integrity="sha512-42kB9yDlYiCEfx2xVwq0q7hT4uf26FUgSIZBK8uiaEnTdShXjwr8Ip1V4xGJMg3mHkUt9nNuTDxunHF0/EgxLQ=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
            rel="stylesheet"
          />
          <script
            src="https://cdnjs.cloudflare.com/ajax/libs/nprogress/0.2.0/nprogress.min.js"
            integrity="sha512-bUg5gaqBVaXIJNuebamJ6uex//mjxPk8kljQTdM1SwkNrQD7pjS+PerntUSD+QRWPNJ0tq54/x4zRV8bLrLhZg=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          ></script>
          {/*<link rel="stylesheet" type="text/css" href="/static/css/nprogress.css" />*/}
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

  try {
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => sheet.collect(<App {...props} />),
      });

    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          {sheet.getStyleElement()}
        </>
      ),
    };
  } finally {
    ctx.renderPage(sheet);
  }
};
