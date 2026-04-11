import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop — scrolls to the top of the page on every route change.
 * Place this inside <BrowserRouter> so it has access to the router context.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use scrollTo with { top: 0 } so it works in all browsers
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
