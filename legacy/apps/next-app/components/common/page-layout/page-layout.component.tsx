import Head from "next/head";
import { PropsWithChildren } from "react"

type PageLayoutProps = PropsWithChildren<{ title?: string }>;

const PageLayout = ({ children, title = 'PokéHub' }: PageLayoutProps) => {
    return (
        <div>
            <Head>
                <title>{title}</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            </Head>
            {children}
        </div>
    )
}

export default PageLayout;