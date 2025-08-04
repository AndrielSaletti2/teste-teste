import { supabase } from '../config/database.js';

export class Rental {
  static async findAll(limit = 50, offset = 0, search = '') {
    try {
      let query = supabase
        .from('rentals')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            student_id
          ),
          lockers:locker_id (
            id,
            number,
            location
          )
        `, { count: 'exact' });

      if (search) {
        query = query.or(`notes.ilike.%${search}%,status.ilike.%${search}%,payment_status.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { rentals: data, total: count };
    } catch (error) {
      console.error('Error finding all rentals:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            student_id
          ),
          lockers:locker_id (
            id,
            number,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding rental by ID:', error);
      throw error;
    }
  }

  static async create(rentalData) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .insert([rentalData])
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            student_id
          ),
          lockers:locker_id (
            id,
            number,
            location
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating rental:', error);
      throw error;
    }
  }

  static async update(id, rentalData) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .update(rentalData)
        .eq('id', id)
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            student_id
          ),
          lockers:locker_id (
            id,
            number,
            location
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating rental:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from('rentals')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting rental:', error);
      throw error;
    }
  }

  static async getStats() {
    try {
      const { data: activeRentals, error: activeError } = await supabase
        .from('rentals')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      if (activeError) {
        throw activeError;
      }

      const { data: overdueRentals, error: overdueError } = await supabase
        .from('rentals')
        .select('id', { count: 'exact' })
        .eq('status', 'overdue');

      if (overdueError) {
        throw overdueError;
      }

      const { data: completedRentals, error: completedError } = await supabase
        .from('rentals')
        .select('id', { count: 'exact' })
        .eq('status', 'completed');

      if (completedError) {
        throw completedError;
      }

      // Calculate total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('rentals')
        .select('total_amount')
        .eq('payment_status', 'paid');

      if (revenueError) {
        throw revenueError;
      }

      const totalRevenue = revenueData.reduce((sum, rental) => sum + parseFloat(rental.total_amount), 0);

      return {
        active: activeRentals.length,
        overdue: overdueRentals.length,
        completed: completedRentals.length,
        total_revenue: totalRevenue
      };
    } catch (error) {
      console.error('Error getting rental stats:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            student_id
          ),
          lockers:locker_id (
            id,
            number,
            location
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding rentals by student ID:', error);
      throw error;
    }
  }

  static async findByLockerId(lockerId) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            student_id
          ),
          lockers:locker_id (
            id,
            number,
            location
          )
        `)
        .eq('locker_id', lockerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding rentals by locker ID:', error);
      throw error;
    }
  }
  static async getActiveRentalsByLockerId(lockerId) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('*')
        .eq('locker_id', lockerId)
        .in('status', ['active', 'overdue']);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding active rentals by locker ID:', error);
      throw error;
    }
  }

  static async getActiveRentalsByStudentId(studentId) {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('*')
        .eq('student_id', studentId)
        .in('status', ['active', 'overdue']);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding active rentals by student ID:', error);
      throw error;
    }
  }
}