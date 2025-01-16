import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Todo } from '../../models/todo.class';

@Component({
  selector: 'app-todo-floating',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './todo-floating.component.html',
  styleUrl: './todo-floating.component.scss'
})
export class TodoFloatingComponent  implements OnInit {



  todos: any[] = []; // To-Do-Liste
  todoForm: FormGroup; // Formular für neue Aufgaben
  userId: string = ''; // ID des aktuellen Benutzers
  progressValue: number = 0; // Fortschrittswert für die Progress-Bar
  completedTasks: number = 0; // Erledigte Aufgaben
  totalTasks: number = 0;
  isNewTodo: boolean = false;
  todoInputValue: string = '';
  selectedPriority: string = 'medium';

  isTodoSectionVisible: boolean = false;

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
    });
  
    // Benutzer-ID aus dem localStorage laden
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.userId = currentUser?.uid || ''; // UID des Benutzers setzen
  }



  todos$ = new BehaviorSubject<Todo[]>([]);

  ngOnInit(): void {
    console.log('Initializing TodoFloatingComponent...'); // Debugging
    this.loadTodos();
    this.updateProgressBar();
  }

  toggleTodoSection(): void {
    const todoSection = document.querySelector('.todos-section');
    if (this.isTodoSectionVisible) {
      // Schließen mit Animation
      todoSection?.classList.add('hidden');
      setTimeout(() => {
        this.isTodoSectionVisible = false; // Nach der Animation wirklich ausblenden
        todoSection?.classList.remove('hidden');
      }, 300); // Entspricht der Animationsdauer in ms
    } else {
      // Öffnen
      this.isTodoSectionVisible = true;
    }
  }

  async loadTodos() {
    const todosCollection = collection(this.firestore, 'todos');
    collectionData(todosCollection, { idField: 'id' }).subscribe((data) => {
      console.log('Loaded raw todos from Firestore:', data); // Debugging
  
      const newTodos = (data as Todo[])
        .filter((todo) => todo.userId === this.userId) // Filter nach Benutzer-ID
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
  
      console.log('Filtered todos for user:', this.userId, newTodos); // Debugging
  
      const currentTodos = this.todos$.getValue();
  
      if (JSON.stringify(newTodos) !== JSON.stringify(currentTodos)) {
        this.todos$.next(newTodos);
        this.updateProgressBar();
      }
    });
  }
  
  

  setPriority(priority: string): void {
    this.selectedPriority = priority;
  }

  newTodo: Partial<Todo> = { description: '' };

  addTodo() {
    if (!this.userId || !this.todoInputValue.trim()) {
      console.warn('Cannot add todo: Missing userId or description');
      return;
    }
  
    const newTodo: Omit<Todo, 'id'> = {
      description: this.todoInputValue.trim(),
      completed: false,
      userId: this.userId, // Benutzer-ID hinzufügen
      createdAt: new Date().toISOString(),
      priority: this.selectedPriority,
    };
  
    console.log('Adding new Todo:', newTodo); // Debugging
  
    const todosCollection = collection(this.firestore, 'todos');
    addDoc(todosCollection, newTodo)
      .then((docRef) => {
        console.log('Todo added with ID:', docRef.id); // Debugging
        this.todoInputValue = '';
        this.selectedPriority = 'medium';
  
        this.isNewTodo = true; // Animation aktivieren
        setTimeout(() => (this.isNewTodo = false), 800);
      })
      .catch((error) => {
        console.error('Error adding Todo:', error); // Debugging
      });
  }
  
  

  trackByTodoId(index: number, todo: any): string {
    return todo.id; // Nutzt die eindeutige ID des Todos
  }

  updateProgressBar(): void {
    const todos = this.todos$.getValue(); // Hole die aktuelle Liste aus todos$
    this.totalTasks = todos.length; // Gesamtanzahl der Aufgaben
    this.completedTasks = todos.filter((todo) => todo.completed).length; // Anzahl der erledigten Aufgaben
    this.progressValue =
      this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0; // Fortschrittswert berechnen
  }


  // Aufgabe als erledigt markieren
  toggleTodoCompletion(todo: any) {
    const todoDoc = doc(this.firestore, `todos/${todo.id}`);
    updateDoc(todoDoc, { completed: !todo.completed });
  }

  // Aufgabe löschen
  deleteTodo(todoId: string) {
    const todoDoc = doc(this.firestore, `todos/${todoId}`);
    deleteDoc(todoDoc);
    this.updateProgressBar();
  }
}
