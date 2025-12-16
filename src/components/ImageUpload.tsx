'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { validateImageFile, createImagePreview } from '@/lib/imageUtils';

interface ImageUploadProps {
	onImagesSelected: (files: File[]) => void;
	maxFiles?: number;
}

export default function ImageUpload({ onImagesSelected, maxFiles = 10 }: ImageUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = useState(false);
	const [previewFiles, setPreviewFiles] = useState<File[]>([]);

	const handleFiles = (files: FileList | null) => {
		if (!files) return;

		const validFiles: File[] = [];
		const errors: string[] = [];

		Array.from(files).forEach((file) => {
			const validation = validateImageFile(file);
			if (validation.valid) {
				if (previewFiles.length + validFiles.length < maxFiles) {
					validFiles.push(file);
				} else {
					errors.push(`${file.name}: 已达到最大上传数量限制`);
				}
			} else {
				errors.push(`${file.name}: ${validation.error}`);
			}
		});

		if (errors.length > 0) {
			alert(errors.join('\n'));
		}

		if (validFiles.length > 0) {
			const newFiles = [...previewFiles, ...validFiles];
			setPreviewFiles(newFiles);
			onImagesSelected(newFiles);
		}
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		handleFiles(e.dataTransfer.files);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleFiles(e.target.files);
	};

	const removeFile = (index: number) => {
		const newFiles = previewFiles.filter((_, i) => i !== index);
		setPreviewFiles(newFiles);
		onImagesSelected(newFiles);
	};

	return (
		<div className="space-y-4">
			{/* 上传区域 */}
			<div
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
				className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
					dragActive
						? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
						: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
				}`}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					multiple
					onChange={handleInputChange}
					className="hidden"
				/>
				<Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
				<p className="text-gray-700 dark:text-gray-300 mb-2">
					拖拽图片到这里，或{' '}
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="text-blue-600 dark:text-blue-400 hover:underline"
					>
						点击选择
					</button>
				</p>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					支持 JPG、PNG、WebP 格式，最多 {maxFiles} 张，每张不超过 10MB
				</p>
			</div>

			{/* 预览列表 */}
			{previewFiles.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{previewFiles.map((file, index) => (
						<div key={index} className="relative group">
							<div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={createImagePreview(file)}
									alt={file.name}
									className="w-full h-full object-cover"
								/>
							</div>
							<button
								type="button"
								onClick={() => removeFile(index)}
								className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
							>
								<X className="w-4 h-4" />
							</button>
							<p className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate" title={file.name}>
								{file.name}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

