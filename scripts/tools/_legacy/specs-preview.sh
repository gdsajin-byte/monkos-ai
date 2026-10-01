#!/bin/bash
cd /Users/kku/monk_project/monkos_AI/portal
AUTH_SECRET=test LEMONSQUEEZY_WEBHOOK_SECRET=test node --input-type=module -e 'import{specsDetailFragment}from"./lib/cms/render-specs.js";const f=specsDetailFragment("kr-passport","ko");if(f){const h="<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><style>"+f.pageStyle+"</style></head><body style=margin:0;padding:0><div>"+f.bodyContent+"</div></body></html>";process.stdout.write(h)}process.exit(0)' > /tmp/specs_preview.html 2>/dev/null
sed -i '' 's|src="/images/|src="file:///Users/kku/monk_project/monkos_AI/portal/public/images/|g' /tmp/specs_preview.html
open -g /tmp/specs_preview.html
echo "Preview updated"
