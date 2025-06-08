import React from "react";

const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Phần thân chính */}
    <path
      d="M22.205 19.93v59.119C22.205 85.097 27.108 90 33.157 90h40.972a3.666 3.666 0 0 0 3.666-3.666V27.264"
      fill="#e15b64"
      stroke="#333"
      strokeWidth="4"
      strokeLinecap="square"
      strokeMiterlimit="10"
    />
    {/* Lớp thứ 2 */}
    <path
      d="M22.205 19.805v59.119c0 6.048 4.903 10.952 10.952 10.952h40.972a3.666 3.666 0 0 0 3.666-3.666V27.14"
      fill="#e15b64"
      stroke="#333"
      strokeWidth="4"
      strokeLinecap="square"
      strokeMiterlimit="10"
    />
    {/* Lớp màu đỏ đậm bên trái */}
    <path
      d="M30.84 21.069l-8.635-1.139v59.119c0 5.253 3.7 9.637 8.635 10.701"
      fill="#c33737"
      stroke="#333"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Nắp trên màu xám */}
    <path
      d="M77.795 27.265H30.838a8.633 8.633 0 0 1-8.633-8.633v0a8.633 8.633 0 0 1 8.633-8.633h46.957"
      fill="#e0e0e0"
      stroke="#333"
      strokeWidth="4"
      strokeLinecap="square"
      strokeMiterlimit="10"
    />
  </svg>
);

export default DocumentIcon;
