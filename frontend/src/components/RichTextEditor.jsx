import React, { useEffect, useRef, useState } from 'react';

export default function RichTextEditor({ value, onChange, placeholder, name }) {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let editorInstance = null;
    let isMounted = true;

    const initEditor = () => {
      if (!isMounted || !window.tinymce || !textareaRef.current) return;
      if (editorRef.current) return;

      window.tinymce.init({
        target: textareaRef.current,
        height: 350,
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount'
        ],
        toolbar:
          'undo redo | formatselect | bold italic underline | \
          alignleft aligncenter alignright alignjustify | \
          bullist numlist outdent indent | link image | code',
        setup: (editor) => {
          editorRef.current = editor;
          editorInstance = editor;
          editor.on('init', () => {
            if (value && isMounted) editor.setContent(value || '');
          });
          editor.on('change keyup', () => {
            if (!isMounted) return;
            const content = editor.getContent();
            onChange({ target: { name, value: content } });
          });
        }
      });
    };

    if (window.tinymce) {
        initEditor();
    } else {
        const existingScript = document.getElementById('tinymce-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'tinymce-script';
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.9.11/tinymce.min.js';
            script.onload = () => {
                if (isMounted) initEditor();
            };
            document.head.appendChild(script);
        } else {
            // Wait for existing script tag to finish evaluating
            const check = setInterval(() => {
                if (window.tinymce && isMounted) {
                    clearInterval(check);
                    initEditor();
                }
            }, 100);
        }
    }

    return () => {
      isMounted = false;
      if (editorInstance && window.tinymce) {
        window.tinymce.remove(editorInstance);
      }
      editorRef.current = null;
    };
  }, [name]); // Do NOT depend on `value` for initialization to prevent re-inits

  // Sync external value changes into the editor if it didn't originate from the editor itself
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const currentContent = editorRef.current.getContent();
      if (currentContent !== value && value !== null) {
        editorRef.current.setContent(value);
      }
    }
  }, [value]);

  return (
    <div style={{ width: '100%', borderRadius: '4px' }}>
      <textarea ref={textareaRef} style={{ width: '100%', minHeight: '300px' }} placeholder={placeholder} />
    </div>
  );
}
