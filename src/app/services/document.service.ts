// src/app/services/document.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DocumentItem } from '../models/document-item.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Upload a file directly to the Lambda function
   */
  uploadFile(file: File): Observable<any> {
    // Create form data to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Add text fields
    formData.append('documentValueCode', 'DD');
    formData.append('documentValueTypeCode', 'DDD');
    
    // Set up query parameters with just the action
    // The file name and type are extracted by busboy from the form data
    let params = new HttpParams().set('action', 'uploadFile');
    
    // Let the browser set the content type header automatically
    console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Send the file to Lambda
    return this.http.post<any>(`${this.apiUrl}`, formData, {
      params,
      responseType: 'json' as 'json'
    });
  }

  /**
   * List all documents
   */
  listDocuments(): Observable<{ documents: DocumentItem[] }> {
    return this.http.get<{ documents: DocumentItem[] }>(`${this.apiUrl}`, {
      params: { action: 'listDocuments' }
    });
  }

  /**
   * Download a file directly from Lambda
   */
  downloadFile(key: string, fileName: string): Observable<ArrayBuffer> {
    // Set up query parameters
    let params = new HttpParams()
      .set('action', 'downloadFile')
      .set('key', key);
    
    // Set up headers based on file type
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    // Check if this is a text file
    const isTextFile = fileExtension === 'txt';
    
    // For text files, we'll handle the response differently
    if (isTextFile) {
      // For text files, we're expecting a JSON response
      return this.http.get(`${this.apiUrl}`, {
        params,
        responseType: 'json' as 'json'
      }).pipe(
        map((response: any) => {
          // Convert the base64 encoded content back to binary
          const binaryString = window.atob(response.fileContent);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes.buffer;
        })
      );
    } else {
      // For other file types, determine the correct content type
      switch (fileExtension) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
      }
      
      // Set Accept header to match expected content type
      const headers = new HttpHeaders().set('Accept', contentType);
      
      // Request the file as arraybuffer
      return this.http.get(`${this.apiUrl}`, {
        params,
        headers,
        responseType: 'arraybuffer'
      });
    }
  }  
}