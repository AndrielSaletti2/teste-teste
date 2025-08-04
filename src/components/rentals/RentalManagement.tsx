import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Package, Users, DollarSign, Clock, Search, Filter } from 'lucide-react';
import Layout from '../common/Layout';
import Button from '../common/Button';
import Table from '../common/Table';
import RentalModal from './RentalModal';
import { Rental } from '../../types';
import { apiService } from '../../services/api';

const RentalManagement: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    overdue: 0,
    completed: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    loadRentals();
    loadStats();
  }, [currentPage, searchTerm]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRentals(currentPage, 10);
      setRentals(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading rentals:', error);
      // Fallback to mock data if API is not available
      setRentals([
        {
          id: '1',
          lockerId: '1',
          studentId: '1',
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          monthlyPrice: 150,
          totalAmount: 900,
          status: 'active',
          paymentStatus: 'paid',
          notes: 'Locação semestral',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          locker: {
            id: '1',
            number: 'A001',
            location: 'Bloco A - 1º Andar',
            size: 'medium',
            status: 'rented',
            monthlyPrice: 150,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          student: {
            id: '1',
            name: 'João Silva',
            email: 'joao.silva@email.com',
            studentId: '2023001',
            course: 'ELETRÔNICA',
            semester: 1,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      ]);
      setTotal(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const dashboardStats = await apiService.getDashboardStats();
      setStats({
        active: dashboardStats.activeRentals,
        overdue: dashboardStats.overdueRentals,
        completed: 247, // Mock data - you might want to add this to dashboard stats
        monthlyRevenue: dashboardStats.monthlyRevenue
      });
    } catch (error) {
      console.error('Error loading rental stats:', error);
      // Fallback stats
      setStats({
        active: 98,
        overdue: 12,
        completed: 247,
        monthlyRevenue: 29400
      });
    }
  };

  const getStatusBadge = (status: Rental['status']) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Ativa' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Em Atraso' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Concluída' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelada' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: Rental['paymentStatus']) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', label: 'Pago' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Em Atraso' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      key: 'locker',
      label: 'Armário',
      render: (value: any, row: Rental) => (
        <div className="flex items-center">
          <Package className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {row.locker?.number || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              {row.locker?.location || 'N/A'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'student',
      label: 'Aluno',
      render: (value: any, row: Rental) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white font-medium text-xs">
                {row.student?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'N/A'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {row.student?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              {row.student?.studentId || 'N/A'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Período',
      render: (value: any, row: Rental) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm text-gray-900">
              {formatDate(row.startDate)} - {formatDate(row.endDate)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Valor Total',
      render: (value: number) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm font-medium text-gray-900">
            R$ {value.toLocaleString('pt-BR')}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: Rental['status']) => getStatusBadge(value),
    },
    {
      key: 'paymentStatus',
      label: 'Pagamento',
      render: (value: Rental['paymentStatus']) => getPaymentStatusBadge(value),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: Rental) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => handleEdit(row.id)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(row.id)}
          />
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedRental(null);
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    const rental = rentals.find(r => r.id === id);
    if (rental) {
      setSelectedRental(rental);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta locação?')) {
      try {
        await apiService.deleteRental(id);
        loadRentals();
      } catch (error) {
        console.error('Error deleting rental:', error);
        alert('Erro ao excluir locação. Tente novamente.');
      }
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedRental(null);
    loadRentals();
    loadStats();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRental(null);
  };

  return (
    <Layout currentPage="rentals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Locações</h1>
            <p className="text-gray-600">Gerencie todas as locações de armários</p>
          </div>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar locações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button icon={Plus} onClick={handleAdd}>
              Nova Locação
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Locações Ativas</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Em Atraso</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.overdue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Receita Mensal</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Concluídas</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rentals Table */}
        <Table
          columns={columns}
          data={rentals}
          loading={loading}
          pagination={{
            currentPage,
            totalPages,
            total,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Rental Modal */}
      {showModal && (
        <RentalModal
          rental={selectedRental}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </Layout>
  );
};

export default RentalManagement;