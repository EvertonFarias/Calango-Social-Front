import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, Subject } from 'rxjs';

export interface UploadResult {
  url: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(private storage: Storage) {}

  uploadFile(
    file: File,
    path: string = 'uploads',
    onProgress?: (progress: number) => void
  ): Observable<UploadResult> {
    const resultSubject = new Subject<UploadResult>();
    const result$ = resultSubject.asObservable();
    
    if (!file) {
      resultSubject.error('No file to upload');
      return result$;
    }

    const fileName = `${new Date().getTime()}_${file.name}`;
    const storageRef = ref(this.storage, `${path}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Upload failed:', error);
        resultSubject.error(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resultSubject.next({ 
            url: downloadURL, 
            path: `${path}/${fileName}` 
          });
          resultSubject.complete();
        }).catch(error => {
          console.error('Failed to get download URL:', error);
          resultSubject.error(error);
        });
      }
    );

    return result$;
  }
    deleteFile(filePath: string): Promise<void> {
    const fileRef = ref(this.storage, filePath);
    return deleteObject(fileRef);
  }
}
