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
            f"pandoc --standalone --mathjax --from markdown --to html5 "
            f"--include-in-header markdown/common/header.html "
            f"--include-before-body markdown/common/body.html "
            f"--css style.css "
            f"--output docs/{relative_filepath}.html {f}"
        )
    )


def main():
    # Create a new "docs" directory from scratch
    if os.path.isdir("../docs"):
        shutil.rmtree(f"../docs")
    shutil.copytree(f"static", f"../docs")

    # Create .nojekyll in docs/
    with open("../docs/.nojekyll", "w"):
        pass

    # Copy HTML files from html/ to docs/.
    html_files = glob.glob(f"html/*.html", recursive=True)
    for f in html_files:
        shutil.copy(f, f"../docs/{os.path.basename(f)}")

    # Convert MD files to HTML and copy them to docs/
    markdown_files = glob.glob(f"markdown/*.md", recursive=True)
    for f in markdown_files:
        pandoc(f)


if __name__ == "__main__":
    main()
