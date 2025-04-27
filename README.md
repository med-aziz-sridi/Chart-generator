# CSV Chart Generator

![Preview](https://i.ibb.co/0RGXyTsn/Capture-d-cran-2025-04-27-021135.png)
![Preview 2](https://i.ibb.co/cSXgBb8b/Capture-d-cran-2025-04-27-022201.png)

Web app to visualize your CSV data as beautiful charts. Just upload your CSV file and instantly see your data as bar, line, pie, area, or scatter charts. You can also preview your data in a table and export your chart as a PDF.

## How to Use

1. **Start the app:**  
   Run `npm start` and open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Upload your CSV:**  
   Drag and drop your CSV file, or click the upload button. Make sure your file has a header row.

3. **Customize your chart:**  
   - Choose the chart type (bar, line, pie, area, scatter).
   - Select which columns to use for axes or values.
   - Adjust chart size and title.
   - Toggle the data table and row limits.

4. **Export your chart:**  
   Click "Export PDF" to save your chart as a PDF file.

## Features

- Fast CSV parsing and chart rendering
- Modern, responsive UI (built with Material UI)
- Supports large files (shows first 100 rows for performance)
- Data table preview with option to show all rows
- Export charts as PDF
- No backend required – all processing is in your browser

## Development

- Built with [React](https://reactjs.org/) and [Create React App](https://github.com/facebook/create-react-app)
- Charts powered by [Recharts](https://recharts.org/)
- File parsing with [PapaParse](https://www.papaparse.com/)
- UI components from [Material UI](https://mui.com/)

## Scripts

- `npm start` – Start the development server
- `npm run build` – Build for production
- `npm test` – Run tests

## Tips

- For best results, use CSV files with clear headers and numeric data for chart values.
- You can always upload a new CSV to reset the app.

---

Made with ❤️ for quick data exploration.
