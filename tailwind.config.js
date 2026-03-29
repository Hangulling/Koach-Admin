module.exports = {
  mode: 'jit',
  darkMode: false,
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
   theme: {
    extend: {
      maxWidth: {
        app: '448px', // 모바일 기본
        tablet: '768px', // 태블릿 대응 너비
        desktop: '1024px', // 데스크탑 대응 너비
      },
      lineHeight: {
        150: '1.5', // 150% 행간 추가
      },
    },
  },
  plugins: [require('daisyui')],

  daisyui: {
    themes: ['light'], // 'light' 테마만 사용
    darkTheme: 'light',
  },
}
