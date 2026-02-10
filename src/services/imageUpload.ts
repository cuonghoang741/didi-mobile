export const uploadImage = async (uri: string): Promise<string | null> => {
    try {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
            uri,
            name: filename,
            type,
        } as any);

        console.log('[uploadImage] Starting upload:', { uri, filename, type });

        const response = await fetch('https://colorme.vn/api/v1/upload-image-public', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://colorme.vn/',
            },
        });

        console.log('[uploadImage] Response status:', response.status);
        const text = await response.text();
        // console.log('[uploadImage] Raw response:', text.substring(0, 100)); // Log first 100 chars

        if (!response.ok) {
            console.error('[uploadImage] Server error:', response.status, text);
            return null;
        }

        if (!text) {
            console.error('[uploadImage] Empty response from server');
            return null;
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('[uploadImage] JSON Parse error:', e, 'Response text:', text);
            return null;
        }

        if (result.status && result.link) {
            return result.link;
        }

        console.error('[uploadImage] Upload failed (API logic):', result);
        return null;
    } catch (error) {
        console.error('[uploadImage] Network or other error:', error);
        return null;
    }
};
