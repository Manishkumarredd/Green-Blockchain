import os
import zipfile
import sys

def make_lambda_zip():
    base_dir = os.path.abspath("backend")
    out_zip = os.path.abspath("backend_lambda.zip")
    if os.path.exists(out_zip):
        os.remove(out_zip)

    targets = ["src", "dist", "package.json", "node_modules"]
    print(f"Creating {out_zip} from {base_dir}...")

    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for t in targets:
            full_path = os.path.join(base_dir, t)
            if os.path.isfile(full_path):
                zf.write(full_path, t)
            elif os.path.isdir(full_path):
                for root, dirs, files in os.walk(full_path):
                    for file in files:
                        filepath = os.path.join(root, file)
                        relpath = os.path.relpath(filepath, base_dir)
                        zf.write(filepath, relpath)

    size_mb = os.path.getsize(out_zip) / (1024 * 1024)
    print(f"Successfully generated {out_zip} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    make_lambda_zip()
