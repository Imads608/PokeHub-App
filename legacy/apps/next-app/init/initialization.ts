import { EmotionCache } from "@emotion/cache";
import { Router } from "next/router";
import NProgress from 'nprogress';
import createEmotionCache from "../styles/mui/createEmotionCache";

export const initApp = (): { emotionCache: EmotionCache } => {
    // Router Page Navigation Progress Bar
    NProgress.configure({ showSpinner: false });

    Router.events.on('routeChangeStart', () => {
        NProgress.start();
    });

    Router.events.on('routeChangeComplete', () => {
    NProgress.done();
    });

    Router.events.on('routeChangeError', () => {
    NProgress.done();
    });

    // Client-side cache, shared for the whole session of the user in the browser.
    return {
       emotionCache: createEmotionCache()
    }
};