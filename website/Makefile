.PHONY: site serve clean

site:
	python makesite.py

serve: site
	python -m http.server --directory serve

clean:
	rm -rf serve
