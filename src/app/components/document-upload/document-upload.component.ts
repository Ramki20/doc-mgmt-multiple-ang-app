// src/app/components/document-upload/document-upload.component.ts
import { Component } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent {
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  allowedFileTypes = ['.docx', '.pdf', '.jpg', '.png', '.jpeg', '.txt', '.xlsx'];
  errorMessage = '';
  successMessage = '';

  constructor(private documentService: DocumentService) { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected file:', file);
      
      // Check if the file type is allowed
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && this.allowedFileTypes.includes(`.${fileExtension}`)) {
        this.selectedFile = file;
        this.errorMessage = '';
        console.log('File selected:', file.name, file.type, file.size);
      } else {
        this.errorMessage = `File type not allowed. Supported types: ${this.allowedFileTypes.join(', ')}`;
        this.selectedFile = null;
      }
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file to upload';
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';
    
    console.log('Starting file upload:', this.selectedFile.name);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 300);

    // Upload file directly through Lambda
    this.documentService.uploadFile(this.selectedFile)
      .pipe(
        finalize(() => {
          clearInterval(progressInterval);
          setTimeout(() => {
            this.isUploading = false;
            if (!this.errorMessage) {
              this.uploadProgress = 0;
              this.selectedFile = null;
              
              // Reset the file input
              const fileInput = document.getElementById('fileInput') as HTMLInputElement;
              if (fileInput) {
                fileInput.value = '';
              }
            }
          }, 1500);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Upload success response:', response);
          this.uploadProgress = 100;
          this.successMessage = `${this.selectedFile!.name} uploaded successfully!`;
          // Emit an event to refresh the document list
          window.dispatchEvent(new CustomEvent('document-uploaded'));
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.uploadProgress = 0;
          this.errorMessage = `Error uploading file: ${error.message || 'Unknown error'}`;
        }
      });
  }
}