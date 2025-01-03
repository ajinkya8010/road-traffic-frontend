import React, { useState } from 'react';
import './pieChartInput.css';
import PieChart from '../../components/pieChart/pieChart';
import axios from 'axios';

const PieChartInput = () => {
  const [category, setCategory] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [complaintData, setComplaintData] = useState([]);
  const [loading, setLoading] = useState(false);

  const wardOptions = [
    { id: 1, name: '1' },
    { id: 2, name: '2' },
    { id: 3, name: '3' },
  ];

  const headOfficeOptions = [
    { id: 1, name: '1' },
    { id: 2, name: '2' },
    { id: 3, name: '3' },
  ];

  const options = category === 'WardOfficeWise' ? wardOptions : category === 'HeadOfficeWise' ? headOfficeOptions : [];

  const handleFetchData = async () => {
    if (new Date(fromDate) > new Date(toDate)) {
      alert('From Date cannot be later than To Date');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        areaTypeId: category === 'WardOfficeWise' ? 1 : 2,
        wardId: category === 'WardOfficeWise' ? selectedOption : null,
        deptId: 0,
        mediaId: 0,
        selectAreaId: 1,
        selectDepartmentId: 0,
        comId: '',
        pageMode: '',
      };

      const response = await axios.post(
        'https://complaint.pmc.gov.in/Grievance_Spring/overallReportNew?language=en',
        requestData
      );

      if (!response.data || response.data.length === 0) {
        alert('No data available for the selected filters.');
        setComplaintData([]);
        return;
      }

      const mappedData = response.data.map((item) => ({
        label: item.AreaName,
        value: item.Total,
        closed: item.Closed,
        pending: item.Pending,
        rejected: item.Rejected,
      }));

      setComplaintData(mappedData);
    } catch (error) {
      console.error('Error fetching complaint data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="dropdown-selection-container">
      <h2>Complaint Data Viewer</h2>
      <div className="dropdown-container">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">--Select Category--</option>
          <option value="WardOfficeWise">Ward Office Wise</option>
          <option value="HeadOfficeWise">Head Office Wise</option>
        </select>

        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
          disabled={!options.length}
        >
          <option value="">--Select an Option--</option>
          {options.map((option, index) => (
            <option key={index} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <div className="date-selectors">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button onClick={handleFetchData} disabled={!category || !selectedOption || !fromDate || !toDate || loading}>
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>
      </div>

      {complaintData.length > 0 && <PieChart data={complaintData} />}
    </div>
  );
};

export default PieChartInput;
