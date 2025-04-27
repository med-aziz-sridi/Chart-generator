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
    primary: { main: '#0078D4' },
    secondary: { main: '#2B88D8' },
    background: { default: '#F3F2F1', paper: '#fff' },
    text: { primary: '#323130', secondary: '#605E5C' }
  },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    h6: { fontSize: '1.25rem', '@media (min-width:600px)': { fontSize: '1.5rem' } }
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 2 } } }
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
  const [limitChartRows, setLimitChartRows] = useState(true); // NEW: toggle for row limit

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
    accept: '.csv',
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

  return (
    <ThemeProvider theme={microsoftTheme}>
      <CssBaseline />
      <div className="App">
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              CSV Chart Generator
            </Typography>
            <Button
              color="inherit"
              startIcon={<Download />}
              onClick={exportAsImage}
              disabled={!data.length}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Export PDF
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {/* Main content: chart and table stacked vertically */}
            <Grid item xs={12} md={8}>
              {isLoading ? (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', background: '#fff' }}>
                  <CircularProgress size={60} thickness={4} sx={{ color: '#0078D4' }} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Processing CSV File...
                  </Typography>
                </Paper>
              ) : data.length > 0 ? (
                <>
                  <Paper elevation={3} className="chart-container" sx={{
                    p: 2, mb: 4, background: '#fff', borderRadius: 3, boxShadow: 2, minHeight: 400
                  }}>
                    <Typography variant="h6" align="center" gutterBottom>
                      {chartOptions.title}
                    </Typography>
                    {limitChartRows && data.length > 100 && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Showing only the first 100 rows for performance.
                      </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Pie chart with horizontal legend */}
                      {chartType === 'pie' ? (
                        <>
                          <Box>
                            {chartComponents[chartType]}
                          </Box>
                          {/* Move only the legend items inside the scrollable container */}
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
                              borderRadius: 1,
                              border: '1px solid #eee',
                              p: 1,
                              background: '#fafbfc'
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
                                    width: 16,
                                    height: 16,
                                    borderRadius: 4,
                                    background: colorPalettes[idx % colorPalettes.length],
                                    marginRight: 8,
                                    border: '1px solid #ccc'
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
                        chartComponents[chartType]
                      )}
                    </Box>
                  </Paper>
                  {showTable && (
                    <Paper elevation={3} className="data-table" sx={{ p: 2, maxHeight: 400, overflow: 'auto', mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Data Preview (First 50 Rows)
                      </Typography>
                      <TableContainer>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              {headers.map((header) => (
                                <TableCell key={header} sx={{ fontWeight: 600, background: '#F3F2F1' }}>
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.slice(0, 50).map((row, idx) => (
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
                    minHeight: '60vh',
                    border: '2px dashed #b0b0b0',
                    borderRadius: 2,
                    background: '#fafbfc',
                    cursor: 'pointer',
                    transition: 'border 0.2s, background 0.2s',
                    textAlign: 'center',
                  }}
                  className="dropzone"
                >
                  <input {...getInputProps()} />
                  <CloudUpload style={{ fontSize: 64, color: '#0078D4' }} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Drag & Drop CSV File or Click to Upload
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Supported format: .csv with header row
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudUpload />}
                    sx={{ fontWeight: 500, textTransform: 'none', mt: 3 }}
                  >
                    Upload CSV File
                  </Button>
                </Box>
              )}
            </Grid>
            {/* Controls Sidebar on the right */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 2, background: '#fff', minWidth: 320, maxWidth: 400 }}>

                <div style={{ height: 0, overflow: 'hidden' }}>
                
                  <input {...getInputProps()} />
                </div>
                {data.length > 0 && (
                  <>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Chart Type</InputLabel>
                      <Select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        label="Chart Type"
                      >
                        {['bar', 'line', 'pie', 'area', 'scatter'].map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {/* Chart Size Slider */}
                    <Box sx={{ mt: 2 }}>
                      <Typography gutterBottom>Chart Width</Typography>
                      <Slider
                        min={400}
                        max={1200}
                        value={chartWidth}
                        onChange={(_, v) => setChartWidth(v)}
                        valueLabelDisplay="auto"
                        sx={{ mb: 1 }}
                      />
                      <Typography gutterBottom>Chart Height</Typography>
                      <Slider
                        min={300}
                        max={800}
                        value={chartHeight}
                        onChange={(_, v) => setChartHeight(v)}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    {/* X/Y/Pie selectors depending on chart type */}
                    {(chartType === 'bar' || chartType === 'line' || chartType === 'area' || chartType === 'scatter') && (
                      <>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>X Axis</InputLabel>
                          <Select
                            value={selectedX}
                            onChange={(e) => setSelectedX(e.target.value)}
                            label="X Axis"
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
                    {/* NEW: Toggle for limiting chart rows */}
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
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
};

export default ChartGenerator;