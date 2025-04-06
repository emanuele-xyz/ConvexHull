#!/usr/bin/env python

import glob
import os
import shlex
import shutil
import subprocess


def pandoc(f):
    """Invokes Pandoc from the command line to convert a Markdown file to HTML"""

    extension = f.rsplit(".")[-1]
    assert extension == "md"

    relative_filepath = "/".join(f.split("/")[1:])  # Extract relative path
    relative_filepath = relative_filepath.rsplit(".")[0]  # Remove file extension

    subprocess.run(
        shlex.split(
            f"pandoc --from markdown --to html5 "
            f"--standalone --mathjax "
            f"--reference-location=section "
            f"--include-in-header markdown/common/header.html "
            f"--include-before-body markdown/common/body.html "
            f"--css style.css "
            f"--output serve/{relative_filepath}.html {f}"
        )
    )


def main():
    # Create a new "serve" directory from scratch
    if os.path.isdir("serve"):
        shutil.rmtree(f"serve")
    shutil.copytree(f"static", f"serve")

    # Copy HTML files from html/ to serve/.
    html_files = glob.glob(f"html/*.html", recursive=True)
    for f in html_files:
        shutil.copy(f, f"serve/{os.path.basename(f)}")

    # Convert MD files to HTML and copy them to serve/
    markdown_files = glob.glob(f"markdown/*.md", recursive=True)
    for f in markdown_files:
        pandoc(f)


if __name__ == "__main__":
    main()
