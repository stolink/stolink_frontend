#!/bin/bash
echo "Identifying files..."
# Find all TS/TSX files containing "stone-"
grep -l -r "stone-" src | grep -E "\.(ts|tsx)$" > files_to_fix.txt

COUNT=$(wc -l < files_to_fix.txt)
echo "Files found: $COUNT"

if [ "$COUNT" -eq 0 ]; then
  echo "No files found."
  exit 0
fi

# Run sed on the file list
xargs sed -i '' \
-e 's/text-stone-950/text-espresso-950/g' \
-e 's/text-stone-900/text-espresso-900/g' \
-e 's/text-stone-800/text-espresso-800/g' \
-e 's/text-stone-700/text-espresso-700/g' \
-e 's/text-stone-600/text-espresso-600/g' \
-e 's/text-stone-500/text-espresso-500/g' \
-e 's/text-stone-400/text-espresso-400/g' \
-e 's/text-stone-300/text-espresso-300/g' \
-e 's/text-stone-200/text-espresso-200/g' \
-e 's/bg-stone-50/bg-cloud-50/g' \
-e 's/bg-stone-100/bg-cloud-100/g' \
-e 's/bg-stone-200/bg-cloud-200/g' \
-e 's/bg-stone-300/bg-cloud-300/g' \
-e 's/bg-stone-400/bg-cloud-400/g' \
-e 's/bg-stone-500/bg-cloud-500/g' \
-e 's/bg-stone-800/bg-espresso-800/g' \
-e 's/bg-stone-900/bg-espresso-900/g' \
-e 's/bg-stone-950/bg-espresso-950/g' \
-e 's/border-stone-50/border-cloud-50/g' \
-e 's/border-stone-100/border-cloud-100/g' \
-e 's/border-stone-200/border-cloud-200/g' \
-e 's/border-stone-300/border-cloud-300/g' \
-e 's/border-stone-400/border-cloud-400/g' \
-e 's/from-stone-200/from-cloud-200/g' \
-e 's/to-stone-200/to-cloud-200/g' \
-e 's/ring-stone-200/ring-cloud-200/g' \
-e 's/ring-stone-900/ring-espresso-900/g' < files_to_fix.txt

echo "Replacement complete."
