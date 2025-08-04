import {Rental} from '../models/Rental.js';

export const getRentals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await Rental.findAll(limit, (page - 1) * limit, search);

    res.json({
      success: true,
      data: result.rentals,
      total: result.total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar locações'
    });
  }
};

export const getRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar locação'
    });
  }
};

export const createRental = async (req, res) => {
  try {
    const {
      lockerId,
      studentId,
      startDate,
      endDate,
      monthlyPrice,
      totalAmount,
      status,
      paymentStatus,
      notes
    } = req.body;

    if (!lockerId || !studentId || !startDate || !endDate || !monthlyPrice || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: armário, aluno, datas, preço mensal e valor total'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'A data de fim deve ser posterior à data de início'
      });
    }

    // Check if locker is available
    const { Locker } = await import('../models/Locker.js');
    const locker = await Locker.findById(lockerId);
    
    if (!locker) {
      return res.status(404).json({
        success: false,
        message: 'Armário não encontrado'
      });
    }
    
    if (locker.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Armário não está disponível para locação'
      });
    }

    // Check if student exists
    const { Student } = await import('../models/Student.js');
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    const rental = await Rental.create({
      lockerId,
      studentId,
      startDate,
      endDate,
      monthlyPrice,
      totalAmount,
      status: status || 'active',
      paymentStatus: paymentStatus || 'pending',
      notes
    });

    // Update locker status to rented
    await Locker.update(lockerId, { status: 'rented' });

    res.status(201).json({
      success: true,
      message: 'Locação criada com sucesso',
      data: rental
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar locação'
    });
  }
};

export const updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get current rental to check status changes
    const currentRental = await Rental.findById(id);
    if (!currentRental) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Validate dates if they are being updated
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'A data de fim deve ser posterior à data de início'
        });
      }
    }

    const rental = await Rental.update(id, updateData);

    // Update locker status if rental status changed
    if (updateData.status && updateData.status !== currentRental.status) {
      const { Locker } = await import('../models/Locker.js');
      
      if (updateData.status === 'completed' || updateData.status === 'cancelled') {
        // Make locker available again
        await Locker.update(currentRental.lockerId, { status: 'available' });
      } else if (updateData.status === 'active' && currentRental.status !== 'active') {
        // Make locker rented
        await Locker.update(currentRental.lockerId, { status: 'rented' });
      }
    }

    res.json({
      success: true,
      message: 'Locação atualizada com sucesso',
      data: rental
    });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar locação'
    });
  }
};

export const deleteRental = async (req, res) => {
  try {
    const { id } = req.params;

    // Get rental info before deleting to update locker status
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    const deleted = await Rental.delete(id);

    // Make locker available again
    if (rental.status === 'active') {
      const { Locker } = await import('../models/Locker.js');
      await Locker.update(rental.lockerId, { status: 'available' });
    }

    res.json({
      success: true,
      message: 'Locação excluída com sucesso'
    });
  } catch (error) {
    console.error('Delete rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir locação'
    });
  }
};