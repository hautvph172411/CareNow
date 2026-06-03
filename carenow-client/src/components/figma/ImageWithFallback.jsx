import { useState } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

export function ImageWithFallback(props) {
  const [didError, setDidError] = useState(false);

  const handleError = () => setDidError(true);

  const { src, alt, style, className, ...rest } = props;

  // Xử lý ảnh chất lượng cao và đường dẫn tương đối từ BookingCare
  const getFullUrl = (url) => {
    if (!url) return url;
    let resolvedUrl = url;
    
    // Nếu là đường dẫn tương đối (không bắt đầu bằng http, data:, hoặc /)
    if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith('data:') && !resolvedUrl.startsWith('/')) {
      resolvedUrl = 'https://cdn.bookingcare.vn/fo/' + resolvedUrl;
    } else if (resolvedUrl.startsWith('/fo/')) {
      resolvedUrl = 'https://cdn.bookingcare.vn' + resolvedUrl;
    }

    // Chuyển sang ảnh chất lượng cao (loại bỏ /w120/, /w256/, /w480/, /w640/...)
    resolvedUrl = resolvedUrl.replace(/\/w\d+(\_\w+)?\//g, '/');
    return resolvedUrl;
  };

  const finalSrc = getFullUrl(src);

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
