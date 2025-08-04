import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, Users, DollarSign, FileText, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { Rental, Student, Locker } from '../../types';
import { apiService } from '../../services/api';

interface RentalModalProps {
  rental: Rental | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RentalModal: React.FC<RentalModalProps> = ({ rental, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lockerId: '',
    studentId: '',
    startDate: '',
    endDate: '',
    monthlyPrice: '',
    totalAmount: '',
    status: 'active' as 'active' | 'overdue' | 'completed' | 'cancelled',
    paymentStatus: 'pending' as 'pending' | 'paid' | 'overdue',
    notes: ''
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const isEditing = !!rental;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (rental) {
      setFormData({
        lockerId: rental.lockerId,
        studentId: rental.studentId,
        startDate: rental.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: rental.endDate.split('T')[0],
        monthlyPrice: rental.monthlyPrice.toString(),
        totalAmount: rental.totalAmount.toString(),
        status: rental.status,
        paymentStatus: rental.paymentStatus,
        notes: rental.notes || ''
      });
    }
  }, [rental]);

  useEffect(() => {
    // Calculate total amount when dates or monthly price change
    if (formData.startDate && formData.endDate && formData.monthlyPrice) {
      calculateTotalAmount();
    }
  }, [formData.startDate, formData.endDate, formData.monthlyPrice]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [studentsResponse, lockersResponse] = await Promise.all([
        apiService.getStudents(1, 100), // Get more students for selection
        apiService.getLockers(1, 100)   // Get more lockers for selection
      ]);

      setStudents(studentsResponse.data || []);
      // Filter only available lockers for new rentals, or include current locker for editing
      const availableLockers = lockersResponse.data?.filter(locker => 
        locker.status === 'available' || (isEditing && locker.id === rental?.lockerId)
      ) || [];
      setLockers(availableLockers);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateTotalAmount = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const monthlyPrice = parseFloat(formData.monthlyPrice);

    if (startDate && endDate && monthlyPrice && endDate > startDate) {
      // Calculate months between dates
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth()) + 1;
      
      const totalAmount = months * monthlyPrice;
      setFormData(prev => ({ ...prev, totalAmount: totalAmount.toString() }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.lockerId || !formData.studentId || !formData.startDate || 
        !formData.endDate || !formData.monthlyPrice || !formData.totalAmount) {
      setError('Todos os campos obrigatórios devem ser preenchidos');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      setError('A data de fim deve ser posterior à data de início');
      return;
    }

    const monthlyPrice = parseFloat(formData.monthlyPrice);
    const totalAmount = parseFloat(formData.totalAmount);

    if (monthlyPrice <= 0 || totalAmount <= 0) {
      setError('Valores devem ser maiores que zero');
      return;
    }

    setIsLoading(true);

    try {
      const rentalData = {
        lockerId: formData.lockerId,
        studentId: formData.studentId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyPrice: monthlyPrice,
        totalAmount: totalAmount,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes
      };

      if (isEditing) {
        await apiService.updateRental(rental.id, rentalData);
      } else {
        await apiService.createRental(rentalData);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar locação');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-center h-32">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando dados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            {isEditing ? 'Editar Locação' : 'Nova Locação'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Armário */}
            <div>
              <label htmlFor="lockerId" className="block text-sm font-medium text-gray-700 mb-1">
                Armário *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  id="lockerId"
                  name="lockerId"
                  value={formData.lockerId}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um armário</option>
                  {lockers.map((locker) => (
                    <option key={locker.id} value={locker.id}>
                      {locker.number} - {locker.location} (R$ {locker.monthlyPrice})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aluno */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                Aluno *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um aluno</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.studentId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data de Início */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Data de Fim */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fim *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Preço Mensal */}
            <div>
              <label htmlFor="monthlyPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Preço Mensal (R$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="monthlyPrice"
                  name="monthlyPrice"
                  value={formData.monthlyPrice}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Valor Total */}
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total (R$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="0.00"
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Calculado automaticamente baseado no período e preço mensal
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="active">Ativa</option>
                <option value="overdue">Em Atraso</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            {/* Status de Pagamento */}
            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Status de Pagamento *
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Em Atraso</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações adicionais sobre a locação..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
            >
              {isEditing ? 'Atualizar' : 'Criar'} Locação
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalModal;