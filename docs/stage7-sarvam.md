# Stage 7: Sarvam language support (built, switched OFF until you choose languages)

## What it does
If a customer writes in a language you have chosen, the website:
1. asks Sarvam to translate the customer's message to English,
2. answers using the normal English logic, which reads prices, stock, fit and order status from your database,
3. asks Sarvam to translate the reply back.

**Sarvam never decides facts.** Before a reply is translated, every price, link, order number, phone number and product name is replaced by a marker, then put back exactly afterwards. If a translation damages any marker, or Sarvam fails or is slow, the customer simply gets the English reply. Plain and right beats fluent and wrong. A test covers this (`npm.cmd test`).

If the translated message is not understood, the normal rule applies: ask a follow-up question or hand over to a person.

## Privacy
Only the text of the customer's message and the bot's reply lines go to Sarvam. Names, phone numbers and order data are not sent. Mention Sarvam in your privacy policy.

## Turn it on (needs your decision)
1. **Choose the languages.** Sarvam's `mayura:v1` model supports 11: Bengali `bn-IN`, English `en-IN`, Gujarati `gu-IN`, Hindi `hi-IN`, Kannada `kn-IN`, Malayalam `ml-IN`, Marathi `mr-IN`, Odia `od-IN`, Punjabi `pa-IN`, Tamil `ta-IN`, Telugu `te-IN` (checked against Sarvam's docs in Oct 2026; re-check before launch).
2. Create a Sarvam account and API key yourself.
3. In `.env.local` set `SARVAM_API_KEY` and `SARVAM_LANGUAGES`, for example `hi-IN,ta-IN`. Restart the site.
4. Test with real sentences from native speakers before telling customers it works.

## Limits to know about
- Language is detected for every message, so a one-word reply like `1` is treated as English. In that case the answer comes back in English.
- Translations of short product questions can be imperfect. Have a native speaker review typical conversations.
- Sarvam limits each translation request to 1,000 characters. Longer messages are not translated.
- The website pages themselves are not translated in this stage. Say if you want that later.
- Sarvam has a paid usage model. Check their current pricing.
