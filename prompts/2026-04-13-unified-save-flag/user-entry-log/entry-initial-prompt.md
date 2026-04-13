we need to replace this CLI setup
```
Output Toggles:
  --save-markdown/--no-save-markdown  Save extracted markdown (default: true)
  --save-raw-html       Save raw HTML to output
  --save-text           Save extracted text
  --save-json           Save extracted JSON
  --save-jsonl          Save all pages as JSONL (single file)
  --save-xml            Save extracted XML
  --save-xml-tei        Save extracted XML-TEI
```
to
use just `--save` with comma separated list of options like: xml,xml-tei,markdown (though, do deep ressearcha and verify it is the best pracice)

this must be consistent acros: npm CLI python CLI, Docker
also, the libraries inerface must be consistent with CLI
Also, Apify Actor interface msut be consistent with CLI -- though, do not update Apify Actor interface / Schema unless absolutelly necessary. Instead, if required update libraries API  or CLI param names
