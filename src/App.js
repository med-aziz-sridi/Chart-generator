import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  BarChart, LineChart, PieChart, AreaChart, ScatterChart,
  Bar, Line, Pie, Area, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import {
  AppBar, Toolbar, Container, Grid, Paper, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Snackbar, Alert, CssBaseline,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  TextField, Slider, Box
} from '@mui/material';
import { CloudUpload, Download } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Microsoft theme with responsive typography
const microsoftTheme = createTheme({
  palette: {
    primary: { main: '#2563eb' }, // More modern blue
    secondary: { main: '#6366f1' },
    background: { default: '#f8fafc', paper: '#fff' },
    text: { primary: '#1e293b', secondary: '#64748b' }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    h6: { fontWeight: 700, fontSize: '1.35rem' }
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } }
  }
});

const colorPalettes = [
  '#0078D4', '#2B88D8', '#71AFE5', '#B4E0FA', '#E5E5E5',
  '#FFB900', '#FF8C00', '#E81123', '#B4009E', '#5C2D91',
  '#00B294', '#0099BC', '#BAD80A', '#FFF100', '#E3008C'
];

// Custom hook for window size tracking
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const ChartGenerator = () => {
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [showTable, setShowTable] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartWidth, setChartWidth] = useState(700);
  const [chartHeight, setChartHeight] = useState(400);
  const [limitChartRows, setLimitChartRows] = useState(true);
  const [showAllTableRows, setShowAllTableRows] = useState(false); // NEW: toggle for table scroll

  const [chartOptions, setChartOptions] = useState({
    title: 'Data Visualization',
    xAxisLabel: 'X Axis',
    yAxisLabel: 'Y Axis',
    colors: colorPalettes,
    showLegend: true,
    showGrid: true
  });

  const [selectedX, setSelectedX] = useState('');
  const [selectedY, setSelectedY] = useState('');
  const [selectedPieValue, setSelectedPieValue] = useState('');

  // Update selected columns and axis labels when headers or chart type change
  useEffect(() => {
    if (headers.length > 0) {
      setSelectedX(headers[0]);
      setSelectedY(headers[1] || headers[0]);
      setSelectedPieValue(headers[1] || headers[0]);
    }
  }, [headers]);

  // Update axis labels to match selected columns
  useEffect(() => {
    setChartOptions(prev => ({
      ...prev,
      xAxisLabel: selectedX || 'X Axis',
      yAxisLabel: selectedY || 'Y Axis'
    }));
  }, [selectedX, selectedY]);

  const onDropAccepted = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setIsLoading(false);
        if (result.errors.length) {
          setError('Error parsing CSV file');
          return;
        }
        setHeaders(result.meta.fields);
        setData(result.data.filter(row => Object.values(row).some(val => val !== "")));
      },
      error: () => {
        setIsLoading(false);
        setError('Invalid CSV format');
      }
    });
  }, []);

  const onDropRejected = useCallback(() => {
    setError('Please upload a valid CSV file');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: { 'text/csv': ['.csv'] }, // modern accept syntax
    multiple: false,
    validator: (file) => {
      if (!file.name.endsWith('.csv')) {
        return { code: 'invalid-type', message: 'Only CSV files allowed' };
      }
      return null;
    }
  });

  const exportAsImage = async () => {
    const chartElement = document.querySelector('.chart-container');
    if (!chartElement) return;
    
    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL('image/png');
    const ratio = canvas.height / canvas.width;
    
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait'
    });
    
    pdf.addImage(imgData, 'PNG', 10, 10, 180, 180 * ratio);
    pdf.save('chart.pdf');
  };

  // Handler to upload a new CSV file (reset state and open file dialog)
  const handleUploadNewCSV = () => {
    setData([]);
    setHeaders([]);
    setChartType('bar');
    setShowTable(true);
    setError(null);
    setIsLoading(false);
    setChartWidth(700);
    setChartHeight(400);
    setLimitChartRows(true);
    setChartOptions({
      title: 'Data Visualization',
      xAxisLabel: 'X Axis',
      yAxisLabel: 'Y Axis',
      colors: colorPalettes,
      showLegend: true,
      showGrid: true
    });
    setSelectedX('');
    setSelectedY('');
    setSelectedPieValue('');
    setShowAllTableRows(false);
    // Open file dialog
    document.getElementById('csv-upload-input').click();
  };

  // Limit chart data for performance, unless disabled
  const chartData = useMemo(
    () => (limitChartRows ? data.slice(0, 100) : data),
    [data, limitChartRows]
  );

  const chartComponents = useMemo(() => ({
    bar: (
      <BarChart
        width={chartWidth}
        height={chartHeight}
        margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
        data={chartData}
      >
        {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={selectedX} label={{ value: selectedX, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: selectedY, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {chartOptions.showLegend && <Legend />}
        <Bar dataKey={selectedY} fill={colorPalettes[0]} />
      </BarChart>
    ),
    line: (
      <LineChart
        width={chartWidth}
        height={chartHeight}
        margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
        data={chartData}
      >
        {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={selectedX} label={{ value: selectedX, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: selectedY, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {chartOptions.showLegend && <Legend />}
        <Line dataKey={selectedY} stroke={colorPalettes[0]} dot={false} />
      </LineChart>
    ),
    pie: (
      <PieChart
        width={Math.max(350, Math.min(chartWidth, 600))}
        height={Math.max(350, Math.min(chartHeight, 600))}
        margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
      >
        <Pie
          data={chartData}
          dataKey={selectedPieValue}
          nameKey={headers[0]}
          cx="50%"
          cy="50%"
          outerRadius={Math.min(chartWidth, chartHeight) / 2.5}
          label
        >
          {chartData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={colorPalettes[idx % colorPalettes.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    ),
    area: (
      <AreaChart
        width={chartWidth}
        height={chartHeight}
        margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
        data={chartData}
      >
        {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={selectedX} label={{ value: selectedX, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: selectedY, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {chartOptions.showLegend && <Legend />}
        <Area
          dataKey={selectedY}
          fill={colorPalettes[0]}
          stroke={colorPalettes[0]}
        />
      </AreaChart>
    ),
    scatter: (
      <ScatterChart
        width={chartWidth}
        height={chartHeight}
        margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
        data={chartData}
      >
        {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={selectedX} label={{ value: selectedX, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: selectedY, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {chartOptions.showLegend && <Legend />}
        <Scatter data={chartData} fill={colorPalettes[0]} />
      </ScatterChart>
    )
  }), [chartData, headers, chartOptions, chartWidth, chartHeight, selectedX, selectedY, selectedPieValue]);

  // Set the page title
  useEffect(() => {
    document.title = "CSV Chart Generator";
  }, []);

  return (
    <ThemeProvider theme={microsoftTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)' }}>
        <AppBar position="static" color="primary" elevation={2} sx={{ borderRadius: 0, mb: 2 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1 }}>
              CSV Chart Generator
            </Typography>
            <Button
              color="inherit"
              startIcon={<Download />}
              onClick={exportAsImage}
              disabled={!data.length}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                transition: 'background 0.2s',
                '&:hover': { background: '#1d4ed8' }
              }}
            >
              Export PDF
            </Button>
            {data.length > 0 && (
              <Button
                color="inherit"
                onClick={handleUploadNewCSV}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  ml: 2,
                  borderRadius: 2,
                  transition: 'background 0.2s',
                  '&:hover': { background: '#1e293b', color: '#fff' }
                }}
              >
                Upload New CSV
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <input
          id="csv-upload-input"
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              onDropAccepted([e.target.files[0]]);
              e.target.value = '';
            }
          }}
        />

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Grid container spacing={4} sx={{ flex: 1, justifyContent: 'center' }}>
            {/* Main content: chart and table stacked vertically */}
            <Grid item xs={12} md={8}>
              {isLoading ? (
                <Paper elevation={4} sx={{
                  p: 6, textAlign: 'center', background: '#fff',
                  borderRadius: 4, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CircularProgress size={64} thickness={4} sx={{ color: '#2563eb' }} />
                  <Typography variant="h6" sx={{ mt: 3, color: '#2563eb', fontWeight: 700 }}>
                    Processing CSV File...
                  </Typography>
                </Paper>
              ) : data.length > 0 ? (
                <>
                  <Paper elevation={4} className="chart-container" sx={{
                    p: 3,
                    mb: 4,
                    background: '#fff',
                    borderRadius: 4,
                    boxShadow: 3,
                    minHeight: 400,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 6 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center', // n7eb el chart tji fel was6 mta3 el paper
                  }}>
                    <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      {chartOptions.title}
                    </Typography>
                    {limitChartRows && data.length > 100 && (
                      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        Showing only the first 100 rows for performance.
                      </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {chartType === 'pie' ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            {chartComponents[chartType]}
                          </Box>
                          <Box
                            className="pie-horizontal-legend"
                            sx={{
                              mt: 2,
                              width: '100%',
                              maxWidth: 600,
                              overflowX: 'auto',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: 2,
                              border: '1px solid #e5e7eb',
                              p: 1,
                              background: '#f1f5f9',
                              mx: 'auto'
                            }}
                          >
                            {chartData.map((entry, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  mr: 3,
                                  minWidth: 0
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 18,
                                    height: 18,
                                    borderRadius: 6,
                                    background: colorPalettes[idx % colorPalettes.length],
                                    marginRight: 8,
                                    border: '1px solid #cbd5e1'
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 120,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={entry[headers[0]]}
                                >
                                  {String(entry[headers[0]])}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          {chartComponents[chartType]}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                  {showTable && (
                    <Paper elevation={3} className="data-table" sx={{
                      p: 2,
                      maxHeight: showAllTableRows ? 600 : 400,
                      overflow: 'auto',
                      mt: 2,
                      borderRadius: 3,
                      boxShadow: 2,
                      background: '#f9fafb'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                          Data Preview {showAllTableRows ? `(All ${data.length} Rows)` : '(First 50 Rows)'}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showAllTableRows}
                              onChange={e => setShowAllTableRows(e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Show All Rows"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      <TableContainer>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              {headers.map((header) => (
                                <TableCell key={header} sx={{ fontWeight: 700, background: '#e0e7ef', color: '#1e293b' }}>
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(showAllTableRows ? data : data.slice(0, 50)).map((row, idx) => (
                              <TableRow key={idx} hover>
                                {headers.map((header) => (
                                  <TableCell key={header}>{row[header] ?? 'N/A'}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  )}
                </>
              ) : (
                <Box
                  {...getRootProps()}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: '60vh', md: '60vh' },
                    height: '100%',
                    border: isDragActive ? '2.5px solid #2563eb' : '2.5px dashed #cbd5e1',
                    borderRadius: 4,
                    background: isDragActive ? '#e0e7ef' : '#f1f5f9',
                    cursor: 'pointer',
                    transition: 'border 0.2s, background 0.2s',
                    textAlign: 'center',
                    boxShadow: isDragActive ? 6 : 2,
                    p: 4,
                    flex: 1,
                    mx: 'auto', // horizontally center
                    maxWidth: 500 // optional: limit width for better centering
                  }}
                  className="dropzone"
                >
                  <input {...getInputProps()} />
                  <CloudUpload style={{ fontSize: 72, color: '#2563eb', marginBottom: 16 }} />
                  <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
                    Drag & Drop CSV File or Click to Upload
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Supported format: <b>.csv</b> with header row
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudUpload />}
                    sx={{
                      fontWeight: 600,
                      textTransform: 'none',
                      mt: 4,
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontSize: '1rem',
                      boxShadow: 2
                    }}
                    onClick={() => document.getElementById('csv-upload-input').click()}
                  >
                    Upload CSV File
                  </Button>
                </Box>
              )}
            </Grid>
            {/* Controls Sidebar on the right */}
            {data.length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper elevation={4} sx={{
                  p: 3,
                  background: '#fff',
                  minWidth: 320,
                  maxWidth: 400,
                  borderRadius: 4,
                  boxShadow: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <div style={{ height: 0, overflow: 'hidden' }}>
                    <input {...getInputProps()} />
                  </div>
                  <>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Chart Type</InputLabel>
                      <Select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        label="Chart Type"
                        MenuProps={{
                          PaperProps: { sx: { borderRadius: 2 } }
                        }}
                      >
                        {['bar', 'line', 'pie', 'area', 'scatter'].map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ mt: 2 }}>
                      <Typography gutterBottom fontWeight={600}>Chart Width</Typography>
                      <Slider
                        min={400}
                        max={1200}
                        value={chartWidth}
                        onChange={(_, v) => setChartWidth(v)}
                        valueLabelDisplay="auto"
                        sx={{ mb: 1 }}
                      />
                      <Typography gutterBottom fontWeight={600}>Chart Height</Typography>
                      <Slider
                        min={300}
                        max={800}
                        value={chartHeight}
                        onChange={(_, v) => setChartHeight(v)}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    {(chartType === 'bar' || chartType === 'line' || chartType === 'area' || chartType === 'scatter') && (
                      <>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>X Axis</InputLabel>
                          <Select
                            value={selectedX}
                            onChange={(e) => setSelectedX(e.target.value)}
                            label="X Axis"
                            MenuProps={{
                              PaperProps: { sx: { borderRadius: 2 } }
                            }}
                          >
                            {headers.map((header) => (
                              <MenuItem key={header} value={header}>{header}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>Y Axis</InputLabel>
                          <Select
                            value={selectedY}
                            onChange={(e) => setSelectedY(e.target.value)}
                            label="Y Axis"
                            MenuProps={{
                              PaperProps: { sx: { borderRadius: 2 } }
                            }}
                          >
                            {headers.map((header) => (
                              <MenuItem key={header} value={header}>{header}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </>
                    )}
                    {chartType === 'pie' && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Pie Value</InputLabel>
                        <Select
                          value={selectedPieValue}
                          onChange={(e) => setSelectedPieValue(e.target.value)}
                          label="Pie Value"
                          MenuProps={{
                            PaperProps: { sx: { borderRadius: 2 } }
                          }}
                        >
                          {headers.map((header) => (
                            <MenuItem key={header} value={header}>{header}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    <TextField
                      label="Chart Title"
                      value={chartOptions.title}
                      onChange={(e) => setChartOptions(prev => ({ ...prev, title: e.target.value }))}
                      fullWidth
                      sx={{ mt: 2 }}
                      inputProps={{ maxLength: 60 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showTable}
                          onChange={(e) => setShowTable(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Show Data Table"
                      sx={{ mt: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={limitChartRows}
                          onChange={(e) => setLimitChartRows(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Limit Chart to 100 Rows"
                      sx={{ mt: 1 }}
                    />
                  </>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" sx={{ width: '100%', borderRadius: 2 }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default ChartGenerator;