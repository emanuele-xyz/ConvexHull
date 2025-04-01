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
            f"--include-in-header common/header.html "
            f"--include-before-body common/body.html "
            f"--css style.css "
            f"--output docs/{relative_filepath}.html {f}"
        )
    )


def main():
    # Create a new docs directory from scratch
    if os.path.isdir("docs"):
        shutil.rmtree(f"docs")
    shutil.copytree(f"static", f"docs")

    # Mimic the directory structure of content/ in docs/
    content_subdirs = glob.glob(f"content/**/", recursive=True)
    content_subdirs.remove("content/")

    for d in content_subdirs:
        d = d.replace("content", "docs", 1)
        if not os.path.isdir(d):
            os.makedirs(d)

    # Create .nojekyll in docs/
    with open("docs/.nojekyll", "w"):
        pass

    html_files = glob.glob(f"content/**/*.html", recursive=True)
    for f in html_files:
        shutil.copy(f, f"docs/{os.path.basename(f)}")

    markdown_files = glob.glob(f"content/**/*.md", recursive=True)
    for f in markdown_files:
        pandoc(f)


if __name__ == "__main__":
    main()
