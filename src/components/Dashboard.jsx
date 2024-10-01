import React, { useState, useEffect } from 'react';
import '../styles/dashboardStyles.scss';
import logo from '../images/alGOLD2.png';
import Calendar from './Calendar';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-plugin-annotation'; // Import the annotation plugin

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const MAX_CANDLES = 30;

const Dashboard = () => {
  const [statusOn, setStatusOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Close Price',
        data: [],
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  });
  const [balance, setBalance] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [rsiValue, setRsiValue] = useState(null);
  const [latestPrice, setLatestPrice] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [realTimeChartData, setRealTimeChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Real-Time Price',
        data: [],
        fill: false,
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        borderColor: 'rgba(0, 255, 0, 0.6)',
        pointRadius: 0,
      },
    ],
  });

  // State to hold pivot points
  const [pivotPoints, setPivotPoints] = useState([]);

  const transactions = [
    { price: '2431.45', pl: '+150', pips: '0.02' },
    { price: '2432.30', pl: '-50', pips: '0.02' },
    { price: '2431.90', pl: '+75', pips: '0.02' },
    { price: '2432.30', pl: '-50', pips: '0.02' },
    { price: '2431.90', pl: '+75', pips: '0.02' },
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      annotation: {
        annotations: {
          staticLine: { // Define your static line annotation
            type: 'line',
            yMin: 2660, // y-value for the line
            yMax: 2660, // y-value for the line
            borderColor: 'orange', // Color of the line
            borderWidth: 2, // Width of the line
            label: {
              content: 'Static Line at 2660',
              enabled: true, // Show the label
              position: 'end', // Position of the label
              color: 'orange', // Color of the label
            },
          },
          pivotPoint: {
            type: 'line',
            yMin: pivotPoints.pivot_point || 0,
            yMax: pivotPoints.pivot_point || 0,
            borderColor: 'blue',
            borderWidth: 2,
            label: {
              content: 'Pivot Point',
              enabled: true,
              position: 'end',
              color: 'blue',
            },
          },
          r1: {
            type: 'line',
            yMin: pivotPoints.r1 || 0,
            yMax: pivotPoints.r1 || 0,
            borderColor: 'green',
            borderWidth: 2,
            label: {
              content: 'Resistance 1 (R1)',
              enabled: true,
              position: 'end',
              color: 'green',
            },
          },
          r2: {
            type: 'line',
            yMin: pivotPoints.r2 || 0,
            yMax: pivotPoints.r2 || 0,
            borderColor: 'green',
            borderWidth: 2,
            label: {
              content: 'Resistance 2 (R2)',
              enabled: true,
              position: 'end',
              color: 'green',
            },
          },
          s1: {
            type: 'line',
            yMin: pivotPoints.s1 || 0,
            yMax: pivotPoints.s1 || 0,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              content: 'Support 1 (S1)',
              enabled: true,
              position: 'end',
              color: 'red',
            },
          },
          s2: {
            type: 'line',
            yMin: pivotPoints.s2 || 0,
            yMax: pivotPoints.s2 || 0,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              content: 'Support 2 (S2)',
              enabled: true,
              position: 'end',
              color: 'red',
            },
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute' },
        display: true,
      },
      y: { display: true },
    },
  };

  useEffect(() => {
    let dataInterval;
    let balanceInterval;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/get_data');

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched Data:', data);

        if (data.length > 0) {
          const newLabels = [];
          const newCloseData = [];

          const latestData = data[data.length - 1];
          setRsiValue(latestData.RSI);
          setLatestPrice(latestData.Close);

          data.forEach((entry) => {
            const date = new Date(entry.Time);
            newLabels.push(date);
            newCloseData.push({ x: date, y: entry.Close });

            if (!lastTimestamp || date > lastTimestamp) {
              setConsoleLogs((prevLogs) => [
                ...prevLogs,
                `New Candle: Close Price - ${entry.Close}`,
              ]);
              setLastTimestamp(date);
            }
          });

          const limitedLabels = newLabels.slice(-MAX_CANDLES);
          const limitedCloseData = newCloseData.slice(-MAX_CANDLES);

          setChartData({
            labels: limitedLabels,
            datasets: [
              {
                label: 'Close Price',
                data: limitedCloseData,
                fill: false,
                backgroundColor: 'rgba(75,192,192,0.2)',
                borderColor: 'rgba(75,192,192,1)',
              },
            ],
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    const fetchBalance = async () => {
      try {
        const response = await fetch('http://localhost:5002/get_balance');

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched Balance:', data);
        setBalance(data.balance);
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };

    const fetchLivePrice = async () => {
      try {
        const response = await fetch('http://localhost:3000/get_live_price');

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setLivePrice(data.live_price);
      } catch (err) {
        console.error('Error fetching live price:', err);
      }
    };

    const fetchPivotPoints = async () => {
      try {
        const response = await fetch('http://localhost:3000/get_pivots');
    
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        console.log('Fetched Pivot Points:', data);
    
        // Set the pivot points with the specific fields from the fetched data
        setPivotPoints({
          pivot_point: data.pivot_point,
          r1: data.r1,
          r2: data.r2,
          s1: data.s1,
          s2: data.s2,
        });
      } catch (err) {
        console.error('Error fetching pivot points:', err);
      }
    };

    if (statusOn) {
      fetchData();
      fetchPivotPoints(); // Fetch pivot points when status is on
      dataInterval = setInterval(fetchData, 15000);
      fetchBalance();
      balanceInterval = setInterval(fetchBalance, 10000);
      fetchLivePrice();
      setInterval(fetchLivePrice, 1000);
    }

    return () => {
      clearInterval(dataInterval);
      clearInterval(balanceInterval);
    };
  }, [statusOn]);

  const toggleStatus = () => {
    setStatusOn((prevStatus) => !prevStatus);
  };

  return (
    <div className="dashboardContainer">
      <div className="dashHeader">
        <img src={logo} alt="Logo" className="dashLogo" />
        <div
          className={`statusButton ${statusOn ? 'On' : 'Off'}`}
          onClick={toggleStatus}
        ></div>
      </div>

      <div className="boxContainer">
        <div className="dashBox L">
          <div className="chartBox">
            <div className="chartTop">
              <div
                className="chartDataBox"
                style={{
                  color: rsiValue > 75 ? 'red' : rsiValue <= 25 ? 'green' : 'white',
                }}
              >
                {typeof rsiValue === 'number' ? rsiValue.toFixed(2) : 'N/A'}
              </div>
              <div className="chartDataBox Long">
                <div className="datalong">
                  {latestPrice !== null ? latestPrice.toFixed(2) : 'Loading...'}
                </div>
              </div>
              <div className="chartDataBox">XAU_USD</div>
            </div>
            <div className="chart">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="liveTradeTableBox">
            <div className="transactionTableHeader">
              <div className="transactionTitle">Price</div>
              <div className="transactionTitle">P&L</div>
              <div className="transactionTitle">Pips</div>
            </div>
            <table className="transactionTable">
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>{transaction.price}</td>
                    <td>{transaction.pl}</td>
                    <td>{transaction.pips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashBox S">
          <div className="logBox console">
            <div className="logBoxTitle">CONSOLE</div>
            <div className="consoleContent">
              {consoleLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
          <div className="logBox algo">
            <div className="logBoxTitle">ALGORITHM</div>
            <div className="pivotHeading">Pivot Points</div>
            <div className="pivotPointsList">
              {Object.keys(pivotPoints).length > 0 ? (
                <>
                  <div className="pivotPoint">
                    <span>Pivot Point:</span> <span>{pivotPoints.pivot_point?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="pivotPoint">
                    <span>Resistance 1 (R1):</span> <span>{pivotPoints.r1?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="pivotPoint">
                    <span>Resistance 2 (R2):</span> <span>{pivotPoints.r2?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="pivotPoint">
                    <span>Support 1 (S1):</span> <span>{pivotPoints.s1?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="pivotPoint">
                    <span>Support 2 (S2):</span> <span>{pivotPoints.s2?.toFixed(2) || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <div>No pivot points available.</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashBox XS">
          <Calendar />
        </div>

        <div className="dashBox Mn">
          <div className="balanceBox">
            <div className="balanceHeading">CURRENT BALANCE: </div>
            <div className="balance">
              {balance !== null ? `${balance} USD` : 'Loading...'}
            </div>
            <div className="balanceBottomLeft">
              <div className="balanceAdded">+ 0 USD</div>
            </div>
            <div className="balanceBottomRight">
              <button className="transactionsButton">TRANSACTIONS</button>
            </div>
          </div>
          <div className="infoBox">
            <div className="balanceHeading low">STATS: </div>
            <div className="statBox">
              <div className="statCount">0</div>
              <div className="statTitle">TRADES</div>
            </div>
            <div className="statBox">
              <div className="statCount">0</div>
              <div className="statTitle">PROFIT TRADES</div>
            </div>
            <div className="statBox">
              <div className="statCount">0</div>
              <div className="statTitle">LOSS TRADES</div>
            </div>
          </div>
        </div>

        <div className="dashBox M">
          <div className="realTimeChartBox">
            <div className="realTimeChartTitle">
              {livePrice !== null ? livePrice.toFixed(2) : 'Loading...'}
            </div>
            <Line className="chartLive" data={realTimeChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
