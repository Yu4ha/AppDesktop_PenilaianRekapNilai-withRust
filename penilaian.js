// CSS javascript (sama seperti sebelumnya)
const style = document.createElement('style');
style.textContent = `
  /* === Filter Section === */
  .filter-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .filter-group label {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  .filter-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    min-width: 150px;
    cursor: pointer;
  }

  .filter-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  }

  .btn-filter {
    padding: 8px 20px;
    background: #0d6efd;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 20px;
  }

  .btn-filter:hover {
    background: #5568d3;
  }

  .btn-filter:active {
    transform: translateY(1px);
  }

  .btn-reset {
    padding: 8px 20px;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 20px;
  }

  .btn-reset:hover {
    background: #7f8c8d;
  }

  /* === Styling tabel nilai === */
  table {
    border-collapse: collapse;
    width: 100%;
    border: 1px solid #000000ff;
  }

  th, td {
    border: 1px solid #000000ff;
    padding: 4px 6px;
    text-align: center;
  }

  th {
    background-color: #f7f7f7;
    font-weight: 600;
  }

  /* === Styling input nilai === */
  input[type="number"] {
    text-align: center;
    font-weight: bold;
    width: 60px;
    border: none;
    outline: none;
    -webkit-appearance: none !important;
    -moz-appearance: textfield !important;
    appearance: none !important;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
  }

  input[type="number"]:focus {
    border-bottom: 2px solid #0078d7;
  }

  /* === Tugas Cell dengan Icon === */
  .tugas-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .tugas-value {
    font-weight: 600;
    color: #2c3e50;
    min-width: 40px;
  }

  .tugas-detail-btn {
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .tugas-detail-btn:hover {
    background: #2980b9;
    transform: scale(1.1);
  }

  /* === Popup Modal === */
  .popup-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9998;
    align-items: center;
    justify-content: center;
  }

  .popup-overlay.active {
    display: flex;
  }

  .popup-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: popupSlideIn 0.3s ease-out;
  }

  @keyframes popupSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .popup-header {
    padding: 20px;
    border-bottom: 2px solid #ecf0f1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .popup-title {
    font-size: 18px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
  }

  .popup-close-btn {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .popup-close-btn:hover {
    background: #c0392b;
    transform: rotate(90deg);
  }

  .popup-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .tugas-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .tugas-item:hover {
    background: #e9ecef;
  }

  .tugas-label {
    font-weight: 600;
    color: #34495e;
    min-width: 80px;
  }

  .tugas-input {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s;
  }

  .tugas-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  .tugas-delete-btn {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .tugas-delete-btn:hover {
    background: #c0392b;
    transform: scale(1.05);
  }

  .add-tugas-btn {
    width: 100%;
    padding: 12px;
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    margin-top: 10px;
    transition: all 0.2s;
  }

  .add-tugas-btn:hover {
    background: #229954;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  }

  .popup-footer {
    padding: 20px;
    border-top: 2px solid #ecf0f1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .popup-rata {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #2c3e50;
    padding: 12px;
    background: #e8f5e9;
    border-radius: 8px;
  }

  .popup-rata-value {
    color: #27ae60;
    font-size: 24px;
  }

  .popup-save-btn {
    width: 100%;
    padding: 14px;
    background: #0d6efd;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    transition: all 0.2s;
  }

  .popup-save-btn:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 43, 237, 0.3);
  }

  /* === Badges === */
  .jenis-badge { 
    padding: 4px 12px; 
    border-radius: 20px; 
    font-size: 12px; 
    font-weight: 600; 
    display: inline-block; 
  }

  /* === Nilai Display === */
  .nilai-display {
    color: #000000ff;
    font-weight: 600;
  }

  /* === Empty State === */
  .tugas-empty {
    color: #95a5a6;
    font-style: italic;
  }
`;
document.head.appendChild(style);
