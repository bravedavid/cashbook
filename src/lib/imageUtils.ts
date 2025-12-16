/**
 * 将 File 对象转换为 Base64 字符串
 */
export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// 移除 data:image/...;base64, 前缀
			const base64 = result.split(',')[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * 创建图片预览 URL
 */
export function createImagePreview(file: File): string {
	return URL.createObjectURL(file);
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
	// 检查文件类型
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
	if (!validTypes.includes(file.type)) {
		return { valid: false, error: '不支持的图片格式，请上传 JPG、PNG 或 WebP 格式的图片' };
	}

	// 检查文件大小（最大 10MB）
	const maxSize = 10 * 1024 * 1024; // 10MB
	if (file.size > maxSize) {
		return { valid: false, error: '图片大小不能超过 10MB' };
	}

	return { valid: true };
}

