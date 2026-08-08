import "i18next";
import pl from "./locales/pl.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof pl;
    };
  }
}
