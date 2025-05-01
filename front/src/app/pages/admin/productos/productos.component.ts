import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductoService, Producto, ProductoDTO } from '../../../services/producto.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  subcategorias: any[] = [];
  busqueda: string = '';


  imagenPreview: string | null = null;
  imagenSeleccionada: File | null = null;

  nuevoProducto: ProductoDTO = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    subcategoria_id: 0
  };

  constructor(private productoService: ProductoService, private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarsubCategorias();
  }

  cargarProductos() {
    this.productoService.listar().subscribe((res) => {
      this.productos = res;
    });
  }

  cargarsubCategorias() {
    this.http.get<any[]>('http://localhost:3000/subcategorias').subscribe((res) => {
      this.subcategorias = res;
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;

      // Vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    if (this.imagenSeleccionada) {
      const formData = new FormData();
      formData.append('imagen', this.imagenSeleccionada);
  
      this.http.post<{ imagen_url: string }>('http://localhost:3000/productos/upload', formData).subscribe(res => {
        this.nuevoProducto.imagen_url = res.imagen_url;
        this.procesarGuardar();
      });
    } else {
      this.procesarGuardar();
    }
  }
  
  procesarGuardar() {
    const esNuevo = !this.nuevoProducto.id;
  
    const observable = esNuevo
      ? this.productoService.crear(this.nuevoProducto)
      : this.productoService.actualizar(this.nuevoProducto.id!, this.nuevoProducto);
  
    observable.subscribe(() => {
      this.resetFormulario();
      this.cargarProductos();
  
      Swal.fire({
        icon: 'success',
        title: esNuevo ? 'Producto creado' : 'Producto actualizado',
        text: esNuevo
          ? 'El producto ha sido agregado correctamente.'
          : 'El producto ha sido actualizado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  resetFormulario() {
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      subcategoria_id: 0
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.eliminar(id).subscribe(() => {
          this.cargarProductos();
          Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
        });
      }
    });
  }

  editar(producto: Producto) {
    this.nuevoProducto = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      subcategoria_id: producto.subcategoria.id??0,
      imagen_url: producto.imagen_url
    };

    if (producto.imagen_url) {
      this.imagenPreview = `http://localhost:3000/uploads/productos/${producto.imagen_url}`;
    } else {
      this.imagenPreview = null;
    }
    this.imagenSeleccionada = null;
  }

  obtenerPorSubcategoria(id: number) {
    return this.http.get<Producto[]>(`http://localhost:3000/productos/subcategoria/${id}`);
  }

  get productosFiltrados() {
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
  
}
