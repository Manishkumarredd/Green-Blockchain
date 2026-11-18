import os
import zipfile

def create_frontend_zip():
    out_dir = 'frontend/out'
    zip_path = 'frontend_deploy.zip'
    
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    print(f"Creating {zip_path} from {out_dir}...")
    file_count = 0
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(out_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, out_dir)
                zipf.write(full_path, rel_path)
                file_count += 1
                
    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Successfully packaged {file_count} files into {zip_path} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    create_frontend_zip()
