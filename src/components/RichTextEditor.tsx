
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

const RichTextEditor = ({ value, onChange, height = 400 }: RichTextEditorProps) => {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold", 
    "italic", 
    "underline", 
    "strike",
    "color", 
    "background",
    "list", 
    "bullet",
    "indent",
    "align",
    "link", 
    "image", 
    "video",
  ];

  // Para lidar com uploads de imagem, podemos adicionar esse recurso posteriormente
  // usando o módulo quill-image-upload se necessário

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      if (input.files) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const imageUrl = reader.result as string;
          // Aqui inserimos a imagem no editor
          const quill = ReactQuill.Quill;
          const range = quill.find(document.querySelector(".quill")).getSelection();
          if (range) {
            quill.find(document.querySelector(".quill")).insertEmbed(range.index, "image", imageUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  };

  return (
    <div style={{ height: height }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={{ height: height - 42, overflow: "auto" }}
      />
    </div>
  );
};

export default RichTextEditor;
