
import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

const RichTextEditor = ({ value, onChange, height = 400 }: RichTextEditorProps) => {
  const editorRef = useRef<any>(null);
  const apiKey = process.env.VITE_TINYMCE_API_KEY || "no-api-key";
  
  return (
    <Editor
      apiKey={apiKey}
      onInit={(evt, editor) => (editorRef.current = editor)}
      initialValue={value}
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: true,
        plugins: [
          "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
          "searchreplace", "visualblocks", "code", "fullscreen",
          "insertdatetime", "media", "table", "code", "help", "wordcount", "emoticons"
        ],
        toolbar: "undo redo | formatselect | " +
          "bold italic backcolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "removeformat | image media link emoticons | help",
        content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
        file_picker_types: "image",
        automatic_uploads: true,
        images_upload_handler: async function (blobInfo) {
          // Em uma implementação real, você enviaria esta imagem para o Supabase Storage
          // e retornaria a URL. Para este exemplo, convertemos para base64.
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(blobInfo.blob());
          });
        },
      }}
    />
  );
};

export default RichTextEditor;
