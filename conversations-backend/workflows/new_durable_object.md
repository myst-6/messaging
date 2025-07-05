Follow these steps precisely to make a new durable object. Create the files automatically, do not ask for permission to proceed.

A. Code

1. Identify the UpperCamelCase name of the DO, by asking the user.
2. Ensure it does not already appear as a DO in the directory.
3. The name should end with `Object`, e.g. `CounterObject` or `ThingObject`
4. Create a new file in the `/src/objects` directory entitled `[lowerCamelCase].ts` where lowerCamelCase is the name of the DO without the suffix `Object`.
5. Import the `DurableObject` class from `cloudflare-workers` and export a class `[UpperCamelCaseObject]`
6. Import that class and re-export it from `/src/index.ts`

B. Wrangler:

1. All migrations are stored in `/wrangler.jsonc`.
2. Add the `"new_sqlite_classes"` attribute to the **latest** migration **if the new DO is not mentioned** in any renaming or deletion operations.
3. If it was mentioned in a renaming or deletion operation, create a new migration and increment the version number in the tag.
4. Add the new durable object binding following the same format.

C. Types:

1. Run the `pnpm run typegen` command from the root directory of the monorepo.
