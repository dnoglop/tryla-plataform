
import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Editor as TinyMCEEditor } from "tinymce";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

const RichTextEditor = ({ value, onChange, height = 400 }: RichTextEditorProps) => {
  const editorRef = useRef<TinyMCEEditor | null>(null);

  return (
    <Editor
      apiKey="9pqha5x0hrrjyuhp1xozn3kpw44dyzlhv2z1jv2ghypts5bh"
      onInit={(evt, editor) => (editorRef.current = editor)}
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: true,
        plugins: [
          'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
        ],
        toolbar:
          "undo redo | formatselect | " +
          "bold italic backcolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "removeformat | image media link emoticons | help",
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
        file_picker_types: "image",
        automatic_uploads: true,
        images_upload_handler: async (blobInfo, success, failure) => {
          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              success(reader.result as string);
            };
            reader.readAsDataURL(blobInfo.blob());
          } catch (error) {
            console.error('Error uploading image:', error);
            failure('Image upload failed');
          }
        },
      }}
    />
  );
};

export default RichTextEditor;
