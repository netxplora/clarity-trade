import { useEffect } from "react";

const GoogleTranslate = () => {
  useEffect(() => {
    // @ts-ignore
    window.googleTranslateElementInit = () => {
      // @ts-ignore
      if (window.google && window.google.translate) {
        // @ts-ignore
        new window.google.translate.TranslateElement(
          // @ts-ignore
          { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
          'google_translate_element'
        );
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    } else {
      // @ts-ignore
      if (window.googleTranslateElementInit) {
        document.getElementById('google_translate_element')!.innerHTML = '';
        // @ts-ignore
        window.googleTranslateElementInit();
      }
    }
  }, []);

  return <div id="google_translate_element" className="translate-widget-container" />;
};

export default GoogleTranslate;
