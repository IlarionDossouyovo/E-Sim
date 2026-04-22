// E-Sim By ELECTRON - Support Ticket System
// Bug tracking and customer support tickets

const express = require('express');
const { users, esims } = require('../models/database');

const router = express.Router();

// In-memory ticket storage
const tickets = new Map();

// Ticket statuses and priorities
const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = ['technical', 'billing', 'activation', 'account', 'feature', 'bug', 'other'];

// =====================
// CREATE TICKET
// =====================

router.post('/create', async (req, res) => {
    try {
        const { userId, category, subject, description, priority } = req.body;
        
        if (!userId || !subject || !description) {
            return res.status(400).json({ error: 'userId, subject and description are required' });
        }
        
        const ticket = {
            id: 'TKT-' + Date.now().toString(36).toUpperCase(),
            userId,
            category: category || 'other',
            subject,
            description,
            priority: priority || 'medium',
            status: 'open',
            assignedTo: null,
            messages: [{
                id: 'msg-1',
                userId,
                message: description,
                createdAt: new Date().toISOString(),
                isStaff: false
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null
        };
        
        tickets.set(ticket.id, ticket);
        
        res.json({
            success: true,
            ticket: {
                id: ticket.id,
                status: ticket.status,
                priority: ticket.priority,
                createdAt: ticket.createdAt
            }
        });
        
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// =====================
// ADD MESSAGE TO TICKET
// =====================

router.post('/message', async (req, res) => {
    try {
        const { ticketId, userId, message, isStaff } = req.body;
        
        if (!ticketId || !userId || !message) {
            return res.status(400).json({ error: 'ticketId, userId and message are required' });
        }
        
        const ticket = tickets.get(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Add message
        const msgId = 'msg-' + Date.now();
        ticket.messages.push({
            id: msgId,
            userId,
            message,
            createdAt: new Date().toISOString(),
            isStaff: isStaff || false
        });
        
        ticket.updatedAt = new Date().toISOString();
        
        // If staff responds, change status
        if (isStaff && ticket.status === 'open') {
            ticket.status = 'in_progress';
        }
        
        tickets.set(ticketId, ticket);
        
        res.json({
            success: true,
            message: 'Message added'
        });
        
    } catch (error) {
        console.error('Add message error:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
});

// =====================
// UPDATE TICKET STATUS
// =====================

router.put('/status', async (req, res) => {
    try {
        const { ticketId, status, assignedTo } = req.body;
        
        if (!ticketId || !status) {
            return res.status(400).json({ error: 'ticketId and status are required' });
        }
        
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const ticket = tickets.get(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        ticket.status = status;
        ticket.assignedTo = assignedTo || ticket.assignedTo;
        
        if (status === 'resolved' || status === 'closed') {
            ticket.resolvedAt = new Date().toISOString();
        }
        
        ticket.updatedAt = new Date().toISOString();
        tickets.set(ticketId, ticket);
        
        res.json({
            success: true,
            status: ticket.status
        });
        
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// =====================
// GET USER TICKETS
// =====================

router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        const userTickets = Array.from(tickets.values())
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        res.json(userTickets);
        
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({ error: 'Failed to get tickets' });
    }
});

// =====================
// GET TICKET BY ID
// =====================

router.get('/:ticketId', (req, res) => {
    try {
        const { ticketId } = req.params;
        
        const ticket = tickets.get(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        res.json(ticket);
        
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ error: 'Failed to get ticket' });
    }
});

// =====================
// GET ALL TICKETS (Admin)
// =====================

router.get('/', (req, res) => {
    try {
        const { status, priority, category } = req.query;
        
        let allTickets = Array.from(tickets.values());
        
        // Filter
        if (status) {
            allTickets = allTickets.filter(t => t.status === status);
        }
        if (priority) {
            allTickets = allTickets.filter(t => t.priority === priority);
        }
        if (category) {
            allTickets = allTickets.filter(t => t.category === category);
        }
        
        // Sort by priority and date
        allTickets.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        // Stats
        const stats = {
            open: allTickets.filter(t => t.status === 'open').length,
            inProgress: allTickets.filter(t => t.status === 'in_progress').length,
            resolved: allTickets.filter(t => t.status === 'resolved').length,
            closed: allTickets.filter(t => t.status === 'closed').length
        };
        
        res.json({ tickets: allTickets, stats });
        
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ error: 'Failed to get tickets' });
    }
});

module.exports = router;