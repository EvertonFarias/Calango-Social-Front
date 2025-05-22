import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { finalize } from 'rxjs/operators';
import { FileUploadService } from '../../../services/FileUploadService';
import { PostRequestDto, PostService } from '../../../services/PostService';
import { UserService } from '../../../services/UserService';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-post-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  templateUrl: './create-post-component.component.html',
  styleUrl: './create-post-component.component.css'
})
export class CreatePostComponent implements OnInit {
  postForm!: FormGroup;
  selectedImage: File | null = null;
  selectedVideo: File | null = null;
  imagePreview: string | null = null;
  videoPreview: string | null = null;
  isUploading = false;
  uploadProgress = 0;
  userId: string = '';
  readonly MAX_IMAGE_SIZE_MB = 5;
  readonly MAX_VIDEO_SIZE_MB = 20;

    private showToast(icon: 'success' | 'error' | 'info', title: string) {
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon,
        title,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private postService: PostService,
    private userService: UserService,
    private router: Router
    
  ) { }
  

  ngOnInit(): void {
    this.postForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
      imageUrl: [null],
      videoUrl: [null]
    });

    const user = this.userService.getCurrentUser();
    if (user) {
      this.userId = user.id;
    } else {
      console.warn('Usuário não encontrado ou ainda não carregado');
    }

  }


onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    if (file.size > this.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      this.showToast('error', `A imagem excede o limite de ${this.MAX_IMAGE_SIZE_MB} MB.`);
      input.value = ''; 
      return;
    }

    this.selectedImage = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedImage);

    this.selectedVideo = null;
    this.videoPreview = null;
    this.postForm.patchValue({ videoUrl: null });
  }
}


  
  onVideoSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    if (file.size > this.MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      this.showToast('error', `O vídeo excede o limite de ${this.MAX_VIDEO_SIZE_MB} MB.`);
      input.value = ''; 
      return;
    }

    this.selectedVideo = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.videoPreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedVideo);

    this.selectedImage = null;
    this.imagePreview = null;
    this.postForm.patchValue({ imageUrl: null });
  }
}


  async submitPost(): Promise<void> {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;
    console.log('Iniciando upload...');
    
    try {
      // Preparar o objeto post
      const post: PostRequestDto = {
        userId: this.userId,
        content: this.postForm.get('content')?.value,
        imageUrl: null,
        videoUrl: null
      };

      // Se houver uma imagem, fazer o upload
      if (this.selectedImage) {
        console.log('Enviando imagem para o Firebase...');
        await this.uploadImage(post);
      } 
      // Se não houver imagem mas houver vídeo, fazer o upload
      else if (this.selectedVideo) {
        console.log('Enviando vídeo para o Firebase...');
        await this.uploadVideo(post);
      } 
      // Se não houver mídia, apenas criar o post
      else {
        console.log('Criando post sem mídia...');
        this.createPost(post);
      }
    } catch (error) {
      console.error('Erro ao criar post:', error);
      this.isUploading = false;
    }
  }

    private uploadImage(post: PostRequestDto): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedImage) return resolve();

      this.fileUploadService.uploadFile(this.selectedImage, 'images', (progress) => {
        this.uploadProgress = progress;
      }).pipe(
        finalize(() => this.isUploading = false)
      ).subscribe({
        next: (result) => {
          post.imageUrl = result.url;
          this.createPost(post);
          resolve();
        },
        error: (error) => {
          console.error('Erro no upload da imagem:', error);
          reject(error);
        }
      });
    });
  }

  private uploadVideo(post: PostRequestDto): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedVideo) return resolve();

      this.fileUploadService.uploadFile(this.selectedVideo, 'videos', (progress) => {
        this.uploadProgress = progress;
      }).pipe(
        finalize(() => this.isUploading = false)
      ).subscribe({
        next: (result) => {
          post.videoUrl = result.url;
          this.createPost(post);
          resolve();
        },
        error: (error) => {
          console.error('Erro no upload do vídeo:', error);
          reject(error);
        }
      });
    });
  }

  private createPost(post: PostRequestDto): void {
    console.log('Enviando post para o backend:', post);
    this.postService.createPost(post).subscribe({
      next: (response) => {
        console.log('Post criado com sucesso:', response);
        Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Post criado com sucesso!',
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true
                  }).then(() => {
                    this.router.navigate([`/user/post/${response.id}`]);
                  });
         
      },
      error: (error) => {
        console.error('Erro ao criar post:', error);
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }

  private resetForm(): void {
    this.postForm.reset();
    this.selectedImage = null;
    this.selectedVideo = null;
    this.imagePreview = null;
    this.videoPreview = null;
  }
}