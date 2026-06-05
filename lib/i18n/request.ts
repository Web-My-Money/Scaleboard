import { getRequestConfig } from "next-intl/server";
import { readAppSettings } from "./app-settings-store";

export default getRequestConfig(async () => {
  const settings = await readAppSettings().catch(() => null);
  const locale = settings?.uiLanguage ?? "es";
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
