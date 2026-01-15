# Translations

This app uses [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for internationalization. Translations are compiled into type-safe functions at build time.

## Supported Languages

- **English** (`en`) - Source language
- **Spanish** (`es`)

To add a new language, update `project.inlang/settings.json` and create the corresponding message file.

---

## Quick Reference

| Task | Location |
|------|----------|
| Add/edit translations | `project.inlang/messages/en.json` and `es.json` |
| Use translations in UI | `import { m } from "@paraglide/messages"` |
| Change user's language | Settings page or `useLocale()` hook |
| Recompile translations | `npm run i18n:compile` or restart dev server |

---

## File Structure

```
project.inlang/
├── settings.json          # Locale config (languages, plugins)
└── messages/
    ├── en.json            # English translations (source)
    └── es.json            # Spanish translations

generated/paraglide/       # Compiled output (do not edit)
src/contexts/LocaleContext.tsx  # Locale state management
```

---

## Adding a New Translation

### Step 1: Add the key to both language files

**`project.inlang/messages/en.json`**
```json
{
  "welcome_message": "Welcome to Family Hub",
  "save_button": "Save"
}
```

**`project.inlang/messages/es.json`**
```json
{
  "welcome_message": "Bienvenido a Family Hub",
  "save_button": "Guardar"
}
```

### Step 2: Restart the dev server (or run `npm run i18n:compile`)

This compiles the JSON into type-safe TypeScript functions.

### Step 3: Use the translation in your component

```tsx
import { m } from "@paraglide/messages";

function MyComponent() {
  return (
    <div>
      <h1>{m.welcome_message()}</h1>
      <button>{m.save_button()}</button>
    </div>
  );
}
```

The `m` object contains all your translation keys as functions. TypeScript will autocomplete available keys and error if you use a key that doesn't exist.

---

## Using Translations in Components

### Basic usage

```tsx
import { m } from "@paraglide/messages";

// Call the message function to get the translated string
<h1>{m.settings_title()}</h1>
<p>{m.settings_subtitle()}</p>
```

### With variables (interpolation)

Define the message with a placeholder:

```json
{
  "greeting": "Hello, {name}!"
}
```

Use it in your component:

```tsx
<p>{m.greeting({ name: user.displayName })}</p>
```

---

## Changing the Language

The app stores the user's language preference in the database (`Member.locale` field). The `LocaleContext` manages the current locale state.

### Using the hook

```tsx
import { useLocale } from "@/contexts/LocaleContext";

function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  
  return (
    <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
      {locale === "en" ? "Español" : "English"}
    </button>
  );
}
```

### How it works

1. On app load, the user's locale is fetched from the database
2. `setLocale()` in `__root.tsx` initializes Paraglide with that locale
3. `LocaleProvider` wraps the app and provides the `useLocale()` hook
4. When the user changes language, it updates both Paraglide and the database

---

## Where Translations Are Currently Used

| File | Keys Used |
|------|-----------|
| `src/routes/_authed/settings/index.tsx` | `settings_title`, `settings_subtitle`, `household_members_heading`, role/member keys |
| `src/routes/_authed/settings/-components/LanguageSection.tsx` | `language_heading`, `language_description`, `language_option_*` |
| `src/routes/_authed/settings/members.$memberId.edit.tsx` | Member form labels |

---

## Naming Conventions

Use descriptive, hierarchical key names:

```
feature_element_description
```

Examples:
- `settings_title` - Settings page title
- `member_delete_confirm` - Member deletion confirmation message
- `language_option_english` - Language selection option

---

## Development Workflow

1. **Start dev server**: `npm run dev`
   - Compiles translations once at startup
   
2. **Edit translations**: Modify files in `project.inlang/messages/`

3. **See changes**: Restart the dev server
   - Or run `npm run i18n:compile` and refresh the page

4. **Production build**: `npm run build`
   - Paraglide Vite plugin compiles and tree-shakes unused translations

---

## Troubleshooting

**TypeScript can't find `@paraglide/messages`**
- Ensure `src/paraglide.d.ts` exists with the module declarations
- Run `npm run i18n:compile` to generate the files

**Translations not updating**
- Restart the dev server after editing message files
- The Paraglide watch mode is disabled due to Windows file watcher issues

**Missing translation key error**
- Add the key to ALL language files (`en.json` AND `es.json`)
- Keys must exist in every locale file
