import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getInsurancePackages, deleteInsurancePackage } from '../api/clinicInsurance.api';
import { getClinics } from '../api/clinic.api';
import Pagination from '../components/Pagination';

export default function InsurancePackages() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [filterClinic, setFilterClinic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    (async () => {
      try {
        const c = await getClinics({ limit: 500, page: 1 });
        if (c?.data) setClinics(c.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchList = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (filterClinic) params.clinic_id = filterClinic;
      if (keyword) params.keyword = keyword;
      const res = await getInsurancePackages(params);
      if (res?.data) {
        setRows(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Lỗi tải');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    setPage(1);
  }, [filterClinic]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchList(1);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    fetchList(page);
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa gói BH và tất cả dòng con?')) return;
    try {
      await deleteInsurancePackage(id);
      fetchList(page);
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <AdminLayout pageTitle="Gói bảo hiểm">
      <div className="management-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="btn-secondary" onClick={() => navigate('/appointment-schedule')}>
          ← Lịch hẹn
        </button>
        <div className="search-box">
          <Search size={20} />
          <input placeholder="Tìm tên gói..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <select className="form-input" style={{ minWidth: 200 }} value={filterClinic} onChange={(e) => { setFilterClinic(e.target.value); setPage(1); }}>
          <option value="">Tất cả bác sĩ</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={() => navigate('/appointment-schedule/insurance-packages/add')}>
          <Plus size={18} />
          Thêm gói BH
        </button>
      </div>

      <div className="management-section" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bác sĩ</th>
                    <th>Đối tác</th>
                    <th>Tên gói</th>
                    <th>TT</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.clinic_name || r.clinic_id}</td>
                      <td>{r.partner_name || '—'}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Shield size={16} style={{ opacity: 0.7 }} />
                          {r.name}
                        </span>
                      </td>
                      <td>{r.status === 1 ? 'Bật' : 'Tắt'}</td>
                      <td>
                        <div className="action-buttons">
                          <button type="button" className="btn-action edit" onClick={() => navigate(`/appointment-schedule/insurance-packages/edit/${r.id}`)}>
                            <Edit2 size={16} />
                          </button>
                          <button type="button" className="btn-action delete" onClick={() => handleDelete(r.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <p style={{ padding: 16, color: '#64748b' }}>Chưa có gói BH</p>}
            {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
