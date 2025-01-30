import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
} from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Todo } from '../../models/todo.class';
import { TodoService } from '../shared/todo.service';
import { UserService } from '../shared/user.service';

@Component({
  selector: 'app-todo-floating',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './todo-floating.component.html',
  styleUrl: './todo-floating.component.scss',
})
export class TodoFloatingComponent implements OnInit {
  chartData: any[] = [];
  todos: any[] = [];
  todoForm: FormGroup;
  userId: string = '';
  progressValue: number = 0;
  completedTasks: number = 0;
  totalTasks: number = 0;
  isNewTodo: boolean = false;
  todoInputValue: string = '';
  selectedPriority: string = 'medium';
  newTodo: Partial<Todo> = { description: '' };
  isTodoSectionVisible = false;
  wasSectionVisible = false;

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder,
    private todoService: TodoService,
    private userService: UserService // ✅ Füge den UserService hinzu
  ) {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  todos$ = new BehaviorSubject<Todo[]>([]);
  @Output() toggleTodo = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.userService.loadUserFromStorage(); // ✅ Stelle sicher, dass der User geladen wird

    this.userService.currentUser$.subscribe((user) => {
      if (user?.uid) {
        this.userId = user.uid;
        this.loadTodos(); // ✅ Lade Todos erst, wenn die userId gesetzt ist
        this.updateProgressBar();
      }
    });
  }

  toggleTodoSection(): void {
    if (this.isTodoSectionVisible) {
      this.isTodoSectionVisible = false;
      setTimeout(() => {
        this.wasSectionVisible = false;
      }, 300);
    } else {
      this.wasSectionVisible = true;
      setTimeout(() => {
        this.isTodoSectionVisible = true;
      }, 10);
    }
  }

  async loadTodos() {
    const todosCollection = collection(this.firestore, 'todos');
    collectionData(todosCollection, { idField: 'id' }).subscribe((data) => {
      const newTodos = (data as Todo[])
        .filter((todo) => todo.userId === this.userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      const currentTodos = this.todos$.getValue();
      if (JSON.stringify(newTodos) !== JSON.stringify(currentTodos)) {
        this.todos$.next(newTodos);
        this.updateProgressBar();
        this.prepareChartData(newTodos);
      }
    });
  }

  setPriority(priority: string): void {
    this.selectedPriority = priority;
  }

  addTodo() {
    if (!this.userId || !this.todoInputValue.trim()) {
      console.warn('Cannot add todo: Missing userId or description');
      return;
    }

    const newTodo = this.createNewTodo();
    this.saveTodoToFirestore(newTodo);
  }

  private createNewTodo(): Omit<Todo, 'id'> {
    return {
      description: this.todoInputValue.trim(),
      completed: false,
      userId: this.userId,
      createdAt: new Date().toISOString(),
      priority: this.selectedPriority,
    };
  }

  private saveTodoToFirestore(newTodo: Omit<Todo, 'id'>) {
    const todosCollection = collection(this.firestore, 'todos');
    addDoc(todosCollection, newTodo)
      .then(() => this.resetTodoForm())
      .catch((error) => console.error('Error adding Todo:', error));
  }

  private resetTodoForm(): void {
    this.todoInputValue = '';
    this.selectedPriority = 'medium';
    this.isNewTodo = true;
    setTimeout(() => (this.isNewTodo = false), 800);
  }

  trackByTodoId(index: number, todo: any): string {
    return todo.id;
  }

  updateProgressBar(): void {
    const todos = this.todos$.getValue();
    this.totalTasks = todos.length;
    this.completedTasks = todos.filter((todo) => todo.completed).length;
    this.progressValue =
      this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
  }

  toggleTodoCompletion(todo: any) {
    const todoDoc = doc(this.firestore, `todos/${todo.id}`);
    updateDoc(todoDoc, { completed: !todo.completed });
  }

  deleteTodo(todoId: string) {
    const todoDoc = doc(this.firestore, `todos/${todoId}`);
    deleteDoc(todoDoc);
    this.updateProgressBar();
  }

  prepareChartData(todos: Todo[]) {
    const priorityCount: Record<'high' | 'medium' | 'low', number> = {
      high: 0,
      medium: 0,
      low: 0,
    };
    todos.forEach((todo) => {
      if (
        todo.priority &&
        (todo.priority === 'high' ||
          todo.priority === 'medium' ||
          todo.priority === 'low')
      ) {
        priorityCount[todo.priority]++;
      }
    });
    const chartData = [
      { name: 'High Priority', value: priorityCount.high },
      { name: 'Medium Priority', value: priorityCount.medium },
      { name: 'Low Priority', value: priorityCount.low },
    ];
    this.todoService.updateChartData(chartData);
  }
}
